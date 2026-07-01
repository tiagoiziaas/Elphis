import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

async function getProfessional(userId: string) {
  return prisma.professionalProfile.findUnique({ where: { userId } })
}

// GET /api/professional/custom-anamnese/submissions?templateId=xxx — List submissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const professional = await getProfessional(session.user.id)
    if (!professional) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')
    const patientId = searchParams.get('patientId')

    const where: any = { professionalProfileId: professional.id }
    if (templateId) where.templateId = templateId
    if (patientId) where.patientId = patientId

    const submissions = await prisma.customAnamneseSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        template: { select: { title: true, questionsJson: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({ submissions })
  } catch {
    return NextResponse.json({ error: 'Falha ao buscar respostas' }, { status: 500 })
  }
}

// POST /api/professional/custom-anamnese/submissions — Save answers for a patient
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const professional = await getProfessional(session.user.id)
    if (!professional) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const body = await request.json()
    const { templateId, patientId, nomeCompleto, answersJson, submissionId } = body

    if (!templateId) return NextResponse.json({ error: 'templateId obrigatório' }, { status: 400 })
    if (!answersJson) return NextResponse.json({ error: 'answersJson obrigatório' }, { status: 400 })

    // Verify template belongs to this professional
    const template = await prisma.customAnamneseTemplate.findUnique({ where: { id: templateId } })
    if (!template || template.professionalProfileId !== professional.id) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // If submissionId provided, update existing
    if (submissionId) {
      const existing = await prisma.customAnamneseSubmission.findUnique({ where: { id: submissionId } })
      if (!existing || existing.professionalProfileId !== professional.id) {
        return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 })
      }
      const updated = await prisma.customAnamneseSubmission.update({
        where: { id: submissionId },
        data: {
          answersJson: typeof answersJson === 'string' ? answersJson : JSON.stringify(answersJson),
          nomeCompleto: nomeCompleto || null,
        },
      })
      return NextResponse.json({ submission: updated })
    }

    // Create new submission
    const submission = await prisma.customAnamneseSubmission.create({
      data: {
        templateId,
        professionalProfileId: professional.id,
        patientId: patientId || null,
        nomeCompleto: nomeCompleto || null,
        answersJson: typeof answersJson === 'string' ? answersJson : JSON.stringify(answersJson),
      },
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Falha ao salvar respostas' }, { status: 500 })
  }
}

