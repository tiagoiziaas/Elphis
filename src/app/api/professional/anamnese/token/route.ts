import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

async function getProfessional(userId: string) {
  return prisma.professionalProfile.findUnique({ where: { userId } })
}

// POST /api/professional/anamnese/token — Generate link token
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const professional = await getProfessional(session.user.id)
    if (!professional) {
      return NextResponse.json({ error: 'Perfil profissional não encontrado' }, { status: 404 })
    }

    // Parse body safely — ignora se vazio ou inválido
    let patientName: string | null = null
    try {
      const body = await request.json()
      patientName = body?.patientName || null
    } catch {
      // body vazio ou inválido — usa null (link genérico sem nome)
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const anamneseToken = await prisma.anamneseToken.create({
      data: {
        token,
        professionalProfileId: professional.id,
        patientName: patientName || null,
        expiresAt,
      },
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const link = `${baseUrl}/anamnese/${token}`

    return NextResponse.json({
      token: anamneseToken.token,
      link,
      expiresAt: anamneseToken.expiresAt,
    })
  } catch (e) {
    console.error('[anamnese/token POST]', e)
    const message = e instanceof Error ? e.message : 'Erro desconhecido'
    return NextResponse.json({ error: `Falha ao gerar token: ${message}` }, { status: 500 })
  }
}

// DELETE /api/professional/anamnese/token?token=xxx — Invalidate token
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const professional = await getProfessional(session.user.id)
    if (!professional) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })

    const existing = await prisma.anamneseToken.findUnique({ where: { token } })
    if (!existing || existing.professionalProfileId !== professional.id) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 404 })
    }

    await prisma.anamneseToken.delete({ where: { token } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[anamnese/token DELETE]', e)
    return NextResponse.json({ error: 'Falha ao invalidar token' }, { status: 500 })
  }
}
