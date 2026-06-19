import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { logError } from '@/lib/logger'

const newPasswordSchema = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(128)
  .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
  .regex(/[0-9]/, 'Deve conter ao menos um número')
  .regex(/[^A-Za-z0-9]/, 'Deve conter ao menos um caractere especial')

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const professional = await (prisma.professionalProfile as any).findUnique({
      where: { userId: session.user.id },
      include: {
        businessCard: true,
        user: true,
      },
    })

    if (!professional) {
      return NextResponse.json({ error: 'Perfil profissional não encontrado' }, { status: 404 })
    }

    const businessCardData = professional.businessCard
      ? {
          ...professional.businessCard,
          services: professional.businessCard.services
            ? JSON.parse(professional.businessCard.services)
            : [],
        }
      : null

    return NextResponse.json({
      settings: {
        isPublic: professional.isPublic,
        email: professional.user.email,
        defaultConsultationType: professional.defaultConsultationType,
        defaultConsultationValue: professional.defaultConsultationValue
          ? Number(professional.defaultConsultationValue)
          : null,
      },
      businessCard: businessCardData,
    })
  } catch (error) {
    logError('Settings GET', error)
    return NextResponse.json({ error: 'Falha ao buscar configurações' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { settings, businessCard, password } = body

    const professional = await (prisma.professionalProfile as any).findUnique({
      where: { userId: session.user.id },
    })

    if (!professional) {
      return NextResponse.json({ error: 'Perfil profissional não encontrado' }, { status: 404 })
    }

    if (password?.current && password?.new) {
      const passwordValidation = newPasswordSchema.safeParse(password.new)
      if (!passwordValidation.success) {
        return NextResponse.json(
          { error: 'Nova senha não atende aos requisitos de segurança', errors: passwordValidation.error.errors },
          { status: 400 }
        )
      }

      const user = await prisma.user.findUnique({ where: { id: session.user.id } })

      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }

      const passwordMatch = await bcrypt.compare(password.current, user.passwordHash)

      if (!passwordMatch) {
        return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
      }

      const newHash = await bcrypt.hash(password.new, 14)

      await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash: newHash },
      })
    }

    if (settings) {
      await (prisma.professionalProfile as any).update({
        where: { userId: session.user.id },
        data: {
          isPublic: settings.isPublic,
          ...(settings.defaultConsultationType !== undefined && {
            defaultConsultationType: settings.defaultConsultationType || null,
          }),
          ...(settings.defaultConsultationValue !== undefined && {
            defaultConsultationValue: settings.defaultConsultationValue
              ? Number(settings.defaultConsultationValue)
              : null,
          }),
        },
      })
    }

    if (businessCard) {
      const existingCard = await prisma.businessCard.findUnique({
        where: { professionalProfileId: professional.id },
      })

      const cardData = {
        phone: businessCard.phone,
        email: businessCard.email,
        website: businessCard.website,
        instagram: businessCard.instagram,
        facebook: businessCard.facebook,
        linkedin: businessCard.linkedin,
        youtube: businessCard.youtube,
        tiktok: businessCard.tiktok,
        address: businessCard.address,
        addressNumber: businessCard.addressNumber,
        addressComplement: businessCard.addressComplement,
        neighborhood: businessCard.neighborhood,
        city: businessCard.city,
        state: businessCard.state,
        zipCode: businessCard.zipCode,
        description: businessCard.description,
        services: Array.isArray(businessCard.services)
          ? JSON.stringify(businessCard.services)
          : (businessCard.services ?? null),
      }

      if (existingCard) {
        await prisma.businessCard.update({ where: { id: existingCard.id }, data: cardData })
      } else {
        await prisma.businessCard.create({
          data: { professionalProfileId: professional.id, ...cardData },
        })
      }
    }

    const updatedProfessional = await (prisma.professionalProfile as any).findUnique({
      where: { userId: session.user.id },
      include: { businessCard: true, user: true },
    })

    return NextResponse.json({
      settings: {
        isPublic: updatedProfessional?.isPublic,
        email: updatedProfessional?.user.email,
        defaultConsultationType: updatedProfessional?.defaultConsultationType,
        defaultConsultationValue: updatedProfessional?.defaultConsultationValue
          ? Number(updatedProfessional.defaultConsultationValue)
          : null,
      },
      businessCard: updatedProfessional?.businessCard
        ? {
            ...updatedProfessional.businessCard,
            services: updatedProfessional.businessCard.services
              ? JSON.parse(updatedProfessional.businessCard.services)
              : [],
          }
        : null,
    })
  } catch (error) {
    logError('Settings PATCH', error)
    return NextResponse.json({ error: 'Falha ao atualizar configurações' }, { status: 500 })
  }
}
