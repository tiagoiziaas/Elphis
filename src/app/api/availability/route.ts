import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logError } from '@/lib/logger'

const availabilityRuleSchema = z.object({
  weekDay: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  active: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!professionalProfile) {
      return NextResponse.json(
        { error: 'Perfil profissional não encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = availabilityRuleSchema.parse(body)

    const availabilityRule = await prisma.availabilityRule.create({
      data: {
        ...validatedData,
        professionalProfileId: professionalProfile.id,
      },
    })

    return NextResponse.json({
      message: 'Regra de disponibilidade criada com sucesso',
      rule: availabilityRule,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      )
    }
    logError('Availability rule POST', error)
    return NextResponse.json(
      { error: 'Falha ao criar regra de disponibilidade' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        availabilityRules: {
          orderBy: { weekDay: 'asc' },
        },
      },
    })

    if (!professionalProfile) {
      return NextResponse.json(
        { error: 'Perfil profissional não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      rules: professionalProfile.availabilityRules,
    })
  } catch (error) {
    logError('Availability GET', error)
    return NextResponse.json(
      { error: 'Falha ao buscar disponibilidade' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!professionalProfile) {
      return NextResponse.json(
        { error: 'Perfil profissional não encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { rules } = z.object({
      rules: z.array(availabilityRuleSchema),
    }).parse(body)

    await prisma.availabilityRule.deleteMany({
      where: { professionalProfileId: professionalProfile.id },
    })

    const createdRules = await prisma.availabilityRule.createMany({
      data: rules.map(rule => ({
        ...rule,
        professionalProfileId: professionalProfile.id,
      })),
    })

    return NextResponse.json({
      message: 'Disponibilidade atualizada com sucesso',
      count: createdRules.count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      )
    }
    logError('Availability PUT', error)
    return NextResponse.json(
      { error: 'Falha ao atualizar disponibilidade' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID da regra é obrigatório' },
        { status: 400 }
      )
    }

    const professionalProfile = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!professionalProfile) {
      return NextResponse.json(
        { error: 'Perfil profissional não encontrado' },
        { status: 404 }
      )
    }

    await prisma.availabilityRule.delete({
      where: {
        id,
        professionalProfileId: professionalProfile.id,
      },
    })

    return NextResponse.json({ message: 'Regra excluída com sucesso' })
  } catch (error) {
    logError('Availability DELETE', error)
    return NextResponse.json(
      { error: 'Falha ao excluir regra' },
      { status: 500 }
    )
  }
}
