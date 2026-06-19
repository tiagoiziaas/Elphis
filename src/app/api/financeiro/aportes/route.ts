import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { logError } from '@/lib/logger'

const aporteSchema = z.object({
  description: z.string().min(1).max(300).trim(),
  value: z.number().min(0).max(9_999_999),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['entrada', 'saida']),
})

async function getProfessional(userId: string) {
  return prisma.professionalProfile.findUnique({ where: { userId }, select: { id: true } })
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const professional = await getProfessional(session.user.id)
    if (!professional) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const aportes = await (prisma as any).aporte.findMany({
      where: { professionalProfileId: professional.id },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ aportes })
  } catch (error) {
    logError('Aportes GET', error)
    return NextResponse.json({ error: 'Falha ao buscar aportes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const professional = await getProfessional(session.user.id)
    if (!professional) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const body = await request.json()
    const validated = aporteSchema.parse(body)

    const aporte = await (prisma as any).aporte.create({
      data: {
        id: randomUUID(),
        professionalProfileId: professional.id,
        description: validated.description,
        value: validated.value,
        date: validated.date,
        type: validated.type,
      },
    })

    return NextResponse.json({ aporte }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      )
    }
    logError('Aportes POST', error)
    return NextResponse.json({ error: 'Falha ao criar aporte' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const professional = await getProfessional(session.user.id)
    if (!professional) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const existing = await (prisma as any).aporte.findUnique({ where: { id } })
    if (!existing || existing.professionalProfileId !== professional.id) {
      return NextResponse.json({ error: 'Aporte não encontrado' }, { status: 404 })
    }

    await (prisma as any).aporte.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logError('Aportes DELETE', error)
    return NextResponse.json({ error: 'Falha ao deletar aporte' }, { status: 500 })
  }
}
