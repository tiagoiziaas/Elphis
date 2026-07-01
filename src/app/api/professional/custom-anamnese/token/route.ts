import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

async function getProfessional(userId: string) {
  return prisma.professionalProfile.findUnique({ where: { userId } })
}

// POST /api/professional/custom-anamnese/token — Generate link token for a template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const professional = await getProfessional(session.user.id)
    if (!professional) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const body = await request.json()
    const { templateId, patientId, expiresInHours = 168 } = body // default 7 days

    if (!templateId) return NextResponse.json({ error: 'templateId obrigatório' }, { status: 400 })

    // Verify template belongs to this professional
    const template = await prisma.customAnamneseTemplate.findUnique({ where: { id: templateId } })
    if (!template || template.professionalProfileId !== professional.id) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

    const customToken = await prisma.customAnamneseToken.create({
      data: {
        token,
        templateId,
        professionalProfileId: professional.id,
        patientId: patientId || null,
        expiresAt,
      },
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const link = `${baseUrl}/f/${token}`

    return NextResponse.json({
      token: customToken.token,
      link,
      expiresAt: customToken.expiresAt,
    })
  } catch (e) {
    console.error('[custom-anamnese/token POST]', e)
    return NextResponse.json({ error: 'Falha ao gerar link' }, { status: 500 })
  }
}
