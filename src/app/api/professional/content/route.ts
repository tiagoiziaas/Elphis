import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

// GET - Get all content posts for authenticated professional
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const professional = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!professional) {
      return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 })
    }

    const posts = await prisma.contentPost.findMany({
      where: { professionalProfileId: professional.id },
      orderBy: { createdAt: 'desc' },
    })

    // Get stats
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
      stats: {
        total,
        published,
        drafts,
      },
    })
  } catch (error) {
    console.error('Content GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content posts' },
      { status: 500 }
    )
  }
}

// POST - Create new content post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const professional = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!professional) {
      return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 })
    }

    // Check if request is FormData (with file attachment) or JSON
    const contentType = request.headers.get('content-type') || ''
    let body: any = {}
    let attachmentUrl: string | null = null
    let videoUrl: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      body = {
        title: formData.get('title'),
        excerpt: formData.get('excerpt'),
        content: formData.get('content'),
        videoUrl: formData.get('videoUrl'),
        type: formData.get('type'),
        status: formData.get('status'),
      }
      // Handle file attachment
      const attachment = formData.get('attachment') as File | null
      if (attachment && attachment.size > 0) {
        attachmentUrl = `/uploads/${professional.id}/${attachment.name}`
      }
      // Handle video file upload
      const videoFile = formData.get('videoFile') as File | null
      if (videoFile && videoFile.size > 0) {
        videoUrl = `/uploads/${professional.id}/videos/${videoFile.name}`
      }
    } else {
      body = await request.json()
    }

    // Generate unique slug from title
    const baseSlug = body.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Check if slug already exists for this professional and add unique suffix
    let slug = baseSlug
    const existingPosts = await prisma.contentPost.findMany({
      where: {
        professionalProfileId: professional.id,
        slug: baseSlug
      }
    })

    if (existingPosts.length > 0) {
      // Add timestamp to make slug unique
      slug = `${baseSlug}-${Date.now().toString().slice(-6)}`
    }

    const post = await prisma.contentPost.create({
      data: {
        professionalProfileId: professional.id,
        title: body.title,
        slug,
        excerpt: body.excerpt,
        content: body.content || '',
        coverImageUrl: body.coverImageUrl,
        videoUrl: videoUrl || body.videoUrl,
        attachmentUrl: attachmentUrl,
        type: body.type || 'ARTICLE',
        status: body.status || 'DRAFT',
        publishedAt: body.status === 'PUBLISHED' ? new Date() : null,
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
    console.error('Content POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create content post' },
      { status: 500 }
    )
  }
}

// PUT - Update content post
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const professional = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!professional) {
      return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const postId = body.id

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    // Verify ownership
    const existingPost = await prisma.contentPost.findUnique({
      where: { id: postId },
    })

    if (!existingPost || existingPost.professionalProfileId !== professional.id) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const updatedData: any = {
      title: body.title,
      excerpt: body.excerpt,
      content: body.content,
      coverImageUrl: body.coverImageUrl,
      videoUrl: body.videoUrl,
      type: body.type,
      status: body.status,
    }

    // Update publishedAt if status changed to PUBLISHED
    if (body.status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED') {
      updatedData.publishedAt = new Date()
    }

    const post = await prisma.contentPost.update({
      where: { id: postId },
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
    console.error('Content PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update content post' },
      { status: 500 }
    )
  }
}

// DELETE - Delete content post
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const professional = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!professional) {
      return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    // Verify ownership
    const existingPost = await prisma.contentPost.findUnique({
      where: { id: postId },
    })

    if (!existingPost || existingPost.professionalProfileId !== professional.id) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    await prisma.contentPost.delete({
      where: { id: postId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Content DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete content post' },
      { status: 500 }
    )
  }
}
