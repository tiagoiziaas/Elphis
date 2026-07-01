import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/f/[token] — Validate token and return template + professional info
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    const customToken = await prisma.customAnamneseToken.findUnique({
      where: { token },
      include: {
        template: { select: { id: true, title: true, questionsJson: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
    })

    if (!customToken) {
      return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
    }

    if (new Date() > customToken.expiresAt) {
      return NextResponse.json({ error: 'Link expirado' }, { status: 410 })
    }

    if (customToken.usedAt) {
      return NextResponse.json({ error: 'Este link já foi utilizado' }, { status: 409 })
    }

    // Fetch professional info
    const professional = await prisma.professionalProfile.findUnique({
      where: { id: customToken.professionalProfileId },
      select: { fullName: true, specialty: true, councilType: true, councilNumber: true, profileImageUrl: true },
    })

    let questions: any[] = []
    try {
      questions = JSON.parse(customToken.template.questionsJson)
    } catch {
      questions = []
    }

    return NextResponse.json({
      valid: true,
      templateTitle: customToken.template.title,
      questions,
      patientName: customToken.patient ? `${customToken.patient.firstName} ${customToken.patient.lastName}` : null,
      professional,
      expiresAt: customToken.expiresAt,
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao validar link' }, { status: 500 })
  }
}

// POST /api/f/[token] — Submit custom anamnese answers
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    const customToken = await prisma.customAnamneseToken.findUnique({
      where: { token },
      include: { template: { select: { id: true } } },
    })

    if (!customToken) {
      return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
    }

    if (new Date() > customToken.expiresAt) {
      return NextResponse.json({ error: 'Link expirado' }, { status: 410 })
    }

    if (customToken.usedAt) {
      return NextResponse.json({ error: 'Este link já foi utilizado' }, { status: 409 })
    }

    const body = await request.json()
    const { nomeCompleto, answersJson } = body

    // If token is linked to a patient, use it; otherwise create new patient
    let patientId = customToken.patientId

    if (!patientId && nomeCompleto) {
      const nameParts = (nomeCompleto as string).trim().split(' ')
      const firstName = nameParts[0] || 'Paciente'
      const lastName = nameParts.slice(1).join(' ') || ''

      const newPatient = await prisma.patient.create({
        data: {
          professionalProfileId: customToken.professionalProfileId,
          firstName,
          lastName,
        },
      })
      patientId = newPatient.id
    }

    const submission = await prisma.customAnamneseSubmission.create({
      data: {
        templateId: customToken.templateId,
        professionalProfileId: customToken.professionalProfileId,
        patientId: patientId || null,
        nomeCompleto: nomeCompleto || null,
        answersJson: typeof answersJson === 'string' ? answersJson : JSON.stringify(answersJson),
      },
    })

    // Mark token as used
    await prisma.customAnamneseToken.update({
      where: { id: customToken.id },
      data: { usedAt: new Date() },
    })

    return NextResponse.json({ success: true, submissionId: submission.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Falha ao salvar respostas' }, { status: 500 })
  }
}
