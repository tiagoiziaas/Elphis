import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logError } from '@/lib/logger'
import { randomBytes } from 'crypto'

const contentPostSchema = z.object({
  title: z.string().min(3).max(300).trim(),
  excerpt: z.string().max(1000).trim().optional().nullable(),
  content: z.string().max(50000).optional().nullable(),
  coverImageUrl: z.string().url().max(2000).optional().nullable(),
  videoUrl: z.string().url().max(2000).optional().nullable(),
  type: z.enum(['ARTICLE', 'VIDEO']).default('ARTICLE'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
})

const contentUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3).max(300).trim().optional(),
  excerpt: z.string().max(1000).trim().optional().nullable(),
  content: z.string().max(50000).optional().nullable(),
  coverImageUrl: z.string().url().max(2000).optional().nullable(),
  videoUrl: z.string().url().max(2000).optional().nullable(),
  type: z.enum(['ARTICLE', 'VIDEO']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
})

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 128)
}

export async function GET(request: NextRequest) {
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

    const posts = await prisma.contentPost.findMany({
      where: { professionalProfileId: professional.id },
      orderBy: { createdAt: 'desc' },
    })

    const total = posts.length
    const published = posts.filter((p) => p.status === 'PUBLISHED').length
    const drafts = posts.filter((p) => p.status === 'DRAFT').length

    return NextResponse.json({
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImageUrl: post.coverImageUrl,
        videoUrl: post.videoUrl,
        type: post.type,
        status: post.status,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      })),
      stats: { total, published, drafts },
    })
  } catch (error) {
    logError('Content GET', error)
    return NextResponse.json({ error: 'Falha ao buscar conteúdos' }, { status: 500 })
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

    const contentType = request.headers.get('content-type') || ''
    let rawBody: Record<string, unknown> = {}
    let attachmentUrl: string | null = null
    let videoUrl: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      rawBody = {
        title: formData.get('title'),
        excerpt: formData.get('excerpt'),
        content: formData.get('content'),
        videoUrl: formData.get('videoUrl'),
        type: formData.get('type'),
        status: formData.get('status'),
      }
      const attachment = formData.get('attachment') as File | null
      if (attachment && attachment.size > 0) {
        attachmentUrl = `/uploads/${professional.id}/${sanitizeFilename(attachment.name)}`
      }
      const videoFile = formData.get('videoFile') as File | null
      if (videoFile && videoFile.size > 0) {
        videoUrl = `/uploads/${professional.id}/videos/${sanitizeFilename(videoFile.name)}`
      }
    } else {
      rawBody = await request.json()
    }

    const validated = contentPostSchema.parse(rawBody)

    const baseSlug = validated.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const existingPosts = await prisma.contentPost.findMany({
      where: { professionalProfileId: professional.id, slug: baseSlug },
    })

    const slug = existingPosts.length > 0
      ? `${baseSlug}-${randomBytes(3).toString('hex')}`
      : baseSlug

    const post = await prisma.contentPost.create({
      data: {
        professionalProfileId: professional.id,
        title: validated.title,
        slug,
        excerpt: validated.excerpt,
        content: validated.content || '',
        coverImageUrl: validated.coverImageUrl,
        videoUrl: videoUrl || validated.videoUrl,
        attachmentUrl,
        type: validated.type,
        status: validated.status,
        publishedAt: validated.status === 'PUBLISHED' ? new Date() : null,
      },
    })

    return NextResponse.json({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.coverImageUrl,
      videoUrl: post.videoUrl,
      attachmentUrl: post.attachmentUrl,
      type: post.type,
      status: post.status,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      )
    }
    logError('Content POST', error)
    return NextResponse.json({ error: 'Falha ao criar conteúdo' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
    const validated = contentUpdateSchema.parse(body)

    const existingPost = await prisma.contentPost.findUnique({
      where: { id: validated.id },
    })

    if (!existingPost || existingPost.professionalProfileId !== professional.id) {
      return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 })
    }

    const updatedData: Record<string, unknown> = {
      title: validated.title,
      excerpt: validated.excerpt,
      content: validated.content,
      coverImageUrl: validated.coverImageUrl,
      videoUrl: validated.videoUrl,
      type: validated.type,
      status: validated.status,
    }

    if (validated.status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED') {
      updatedData.publishedAt = new Date()
    }

    const post = await prisma.contentPost.update({
      where: { id: validated.id },
      data: updatedData,
    })

    return NextResponse.json({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.coverImageUrl,
      videoUrl: post.videoUrl,
      type: post.type,
      status: post.status,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      )
    }
    logError('Content PUT', error)
    return NextResponse.json({ error: 'Falha ao atualizar conteúdo' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json({ error: 'ID do conteúdo é obrigatório' }, { status: 400 })
    }

    const existingPost = await prisma.contentPost.findUnique({
      where: { id: postId },
    })

    if (!existingPost || existingPost.professionalProfileId !== professional.id) {
      return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 })
    }

    await prisma.contentPost.delete({ where: { id: postId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logError('Content DELETE', error)
    return NextResponse.json({ error: 'Falha ao excluir conteúdo' }, { status: 500 })
  }
}
