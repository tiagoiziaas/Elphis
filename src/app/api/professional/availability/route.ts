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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const professional = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
      include: { availabilityRules: true },
    })

    if (!professional) {
      return NextResponse.json({ error: 'Perfil profissional não encontrado' }, { status: 404 })
    }

    const availability = professional.availabilityRules.map((rule) => ({
      id: rule.id,
      weekDay: rule.weekDay,
      startTime: rule.startTime,
      endTime: rule.endTime,
      active: rule.active,
    }))

    return NextResponse.json({ availability })
  } catch (error) {
    logError('Availability GET', error)
    return NextResponse.json({ error: 'Falha ao buscar disponibilidade' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const professional = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!professional) {
      return NextResponse.json({ error: 'Perfil profissional não encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const rulesSchema = z.object({ rules: z.array(availabilityRuleSchema) })
    const { rules } = rulesSchema.parse(body)

    await prisma.availabilityRule.deleteMany({
      where: { professionalProfileId: professional.id },
    })

    await prisma.availabilityRule.createMany({
      data: rules.map((rule) => ({
        professionalProfileId: professional.id,
        weekDay: rule.weekDay,
        startTime: rule.startTime,
        endTime: rule.endTime,
        active: rule.active,
      })),
    })

    const availability = await prisma.availabilityRule.findMany({
      where: { professionalProfileId: professional.id },
    })

    return NextResponse.json({
      availability: availability.map((rule) => ({
        id: rule.id,
        weekDay: rule.weekDay,
        startTime: rule.startTime,
        endTime: rule.endTime,
        active: rule.active,
      })),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      )
    }
    logError('Availability POST', error)
    return NextResponse.json({ error: 'Falha ao salvar disponibilidade' }, { status: 500 })
  }
}
