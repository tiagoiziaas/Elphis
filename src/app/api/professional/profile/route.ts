import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const profilePatchSchema = z.object({
  fullName: z.string().min(2).max(150).trim().optional(),
  name: z.string().min(2).max(150).trim().optional(),
  title: z.string().min(2).max(150).trim().optional(),
  specialty: z.string().min(2).max(150).trim().optional(),
  city: z.string().min(2).max(100).trim().optional(),
  state: z.string().min(2).max(100).trim().optional(),
  bio: z.string().max(3000).trim().optional().nullable(),
  approach: z.string().max(3000).trim().optional().nullable(),
  headline: z.string().max(300).trim().optional().nullable(),
  profileImageUrl: z.string().url().max(2000).optional().nullable(),
  coverImageUrl: z.string().url().max(2000).optional().nullable(),
  whatsapp: z.string().max(30).trim().optional().nullable(),
  instagram: z.string().max(100).trim().optional().nullable(),
  website: z.string().url().max(500).optional().nullable(),
  isPublic: z.boolean().optional(),
  councilType: z.string().max(20).trim().optional().nullable(),
  councilNumber: z.string().max(30).trim().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const professional = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        services: true,
        availabilityRules: true,
        businessCard: true,
        user: true,
      },
    })

    if (!professional) {
      return NextResponse.json({ error: 'Perfil profissional não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      id: professional.id,
      userId: professional.userId,
      slug: professional.slug,
      fullName: professional.fullName,
      title: professional.title,
      specialty: professional.specialty,
      city: professional.city,
      state: professional.state,
      bio: professional.bio,
      approach: professional.approach,
      headline: professional.headline,
      profileImageUrl: professional.profileImageUrl,
      coverImageUrl: professional.coverImageUrl,
      whatsapp: professional.whatsapp,
      instagram: professional.instagram,
      website: professional.website,
      isPublic: professional.isPublic,
      councilType: (professional as any).councilType,
      councilNumber: (professional as any).councilNumber,
      services: professional.services,
      availabilityRules: professional.availabilityRules,
      businessCard: professional.businessCard,
      user: {
        name: professional.user.name,
        email: professional.user.email,
      },
    })
  } catch (error) {
    logError('Professional profile GET', error)
    return NextResponse.json(
      { error: 'Falha ao buscar perfil profissional' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = profilePatchSchema.parse(body)

    if (validated.fullName || validated.name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: validated.fullName || validated.name },
      })
    }

    const professional = await (prisma.professionalProfile as any).update({
      where: { userId: session.user.id },
      data: {
        fullName: validated.fullName,
        title: validated.title,
        specialty: validated.specialty,
        city: validated.city,
        state: validated.state,
        bio: validated.bio,
        approach: validated.approach,
        headline: validated.headline,
        profileImageUrl: validated.profileImageUrl,
        coverImageUrl: validated.coverImageUrl,
        whatsapp: validated.whatsapp,
        instagram: validated.instagram,
        website: validated.website,
        isPublic: validated.isPublic,
        ...(validated.councilType !== undefined && { councilType: validated.councilType || null }),
        ...(validated.councilNumber !== undefined && { councilNumber: validated.councilNumber || null }),
      },
      include: {
        services: true,
        availabilityRules: true,
        user: true,
      },
    })

    return NextResponse.json({
      id: professional.id,
      userId: professional.userId,
      slug: professional.slug,
      fullName: professional.fullName,
      title: professional.title,
      specialty: professional.specialty,
      city: professional.city,
      state: professional.state,
      bio: professional.bio,
      approach: professional.approach,
      headline: professional.headline,
      profileImageUrl: professional.profileImageUrl,
      coverImageUrl: professional.coverImageUrl,
      whatsapp: professional.whatsapp,
      instagram: professional.instagram,
      website: professional.website,
      isPublic: professional.isPublic,
      councilType: professional.councilType,
      councilNumber: professional.councilNumber,
      services: professional.services,
      availabilityRules: professional.availabilityRules,
      user: {
        name: professional.user.name,
        email: professional.user.email,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      )
    }
    logError('Professional profile PATCH', error)
    return NextResponse.json(
      { error: 'Falha ao atualizar perfil profissional' },
      { status: 500 }
    )
  }
}
