import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logError } from '@/lib/logger'

const createContentSchema = z.object({
  title: z.string().min(3).max(300).trim(),
  slug: z.string().max(350).optional(),
  excerpt: z.string().max(1000).trim().optional(),
  content: z.string().min(10).max(50000),
  coverImageUrl: z.string().url().max(2000).optional().nullable(),
  videoUrl: z.string().url().max(2000).optional().nullable(),
  type: z.enum(['ARTICLE', 'VIDEO']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
})

const updateContentSchema = z.object({
  title: z.string().min(3).max(300).trim().optional(),
  slug: z.string().max(350).optional(),
  excerpt: z.string().max(1000).trim().optional(),
  content: z.string().min(10).max(50000).optional(),
  coverImageUrl: z.string().url().max(2000).optional().nullable(),
  videoUrl: z.string().url().max(2000).optional().nullable(),
  type: z.enum(['ARTICLE', 'VIDEO']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
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
    const validatedData = createContentSchema.parse(body)

    const slug = validatedData.slug ||
      validatedData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

    const contentPost = await prisma.contentPost.create({
      data: {
        ...validatedData,
        slug,
        professionalProfileId: professionalProfile.id,
        publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null,
      },
    })

    return NextResponse.json({
      message: 'Conteúdo criado com sucesso',
      post: contentPost,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      )
    }
    logError('Content POST', error)
    return NextResponse.json(
      { error: 'Falha ao criar conteúdo' },
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
    })

    if (!professionalProfile) {
      return NextResponse.json(
        { error: 'Perfil profissional não encontrado' },
        { status: 404 }
      )
    }

    const contentPosts = await prisma.contentPost.findMany({
      where: { professionalProfileId: professionalProfile.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ posts: contentPosts })
  } catch (error) {
    logError('Content GET', error)
    return NextResponse.json(
      { error: 'Falha ao buscar conteúdos' },
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
        { error: 'ID do conteúdo é obrigatório' },
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

    await prisma.contentPost.delete({
      where: {
        id,
        professionalProfileId: professionalProfile.id,
      },
    })

    return NextResponse.json({ message: 'Conteúdo excluído com sucesso' })
  } catch (error) {
    logError('Content DELETE', error)
    return NextResponse.json(
      { error: 'Falha ao excluir conteúdo' },
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do conteúdo é obrigatório' },
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

    const body = await request.json()
    const validatedData = updateContentSchema.parse(body)

    const contentPost = await prisma.contentPost.update({
      where: {
        id,
        professionalProfileId: professionalProfile.id,
      },
      data: {
        ...validatedData,
        publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : undefined,
      },
    })

    return NextResponse.json({
      message: 'Conteúdo atualizado com sucesso',
      post: contentPost,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      )
    }
    logError('Content PATCH', error)
    return NextResponse.json(
      { error: 'Falha ao atualizar conteúdo' },
      { status: 500 }
    )
  }
}
