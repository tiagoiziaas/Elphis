import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

async function getProfessional(userId: string) {
  return prisma.professionalProfile.findUnique({ where: { userId } })
}

// GET /api/professional/custom-anamnese/templates — List all templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const professional = await getProfessional(session.user.id)
    if (!professional) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const templates = await prisma.customAnamneseTemplate.findMany({
      where: { professionalProfileId: professional.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { submissions: true } },
      },
    })

    return NextResponse.json({ templates })
  } catch {
    return NextResponse.json({ error: 'Falha ao buscar templates' }, { status: 500 })
  }
}

// POST /api/professional/custom-anamnese/templates — Create template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const professional = await getProfessional(session.user.id)
    if (!professional) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const body = await request.json()
    const { title, questionsJson } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })
    if (!questionsJson) return NextResponse.json({ error: 'Perguntas obrigatórias' }, { status: 400 })

    const template = await prisma.customAnamneseTemplate.create({
      data: {
        professionalProfileId: professional.id,
        title: title.trim(),
        questionsJson: typeof questionsJson === 'string' ? questionsJson : JSON.stringify(questionsJson),
      },
    })

    return NextResponse.json({ template })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Falha ao criar template' }, { status: 500 })
  }
}

// PUT /api/professional/custom-anamnese/templates — Update template
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const professional = await getProfessional(session.user.id)
    if (!professional) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const body = await request.json()
    const { id, title, questionsJson } = body

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const existing = await prisma.customAnamneseTemplate.findUnique({ where: { id } })
    if (!existing || existing.professionalProfileId !== professional.id) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    const template = await prisma.customAnamneseTemplate.update({
      where: { id },
      data: {
        ...(title?.trim() ? { title: title.trim() } : {}),
        ...(questionsJson ? { questionsJson: typeof questionsJson === 'string' ? questionsJson : JSON.stringify(questionsJson) } : {}),
      },
    })

    return NextResponse.json({ template })
  } catch {
    return NextResponse.json({ error: 'Falha ao atualizar template' }, { status: 500 })
  }
}

// DELETE /api/professional/custom-anamnese/templates?id=xxx — Delete template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const professional = await getProfessional(session.user.id)
    if (!professional) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const existing = await prisma.customAnamneseTemplate.findUnique({ where: { id } })
    if (!existing || existing.professionalProfileId !== professional.id) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    await prisma.customAnamneseTemplate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Falha ao excluir template' }, { status: 500 })
  }
}
