import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logError } from "@/lib/logger"

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug

    const profile = await prisma.professionalProfile.findUnique({
      where: { slug },
      include: {
        services: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            duration: true,
          },
        },
        availabilityRules: {
          where: { active: true },
          select: {
            weekDay: true,
            startTime: true,
            endTime: true,
          },
        },
        contentPosts: {
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            excerpt: true,
            content: true,
            type: true,
            videoUrl: true,
            attachmentUrl: true,
            publishedAt: true,
            createdAt: true,
          },
        },
        businessCard: true,
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      )
    }

    if (!profile.isPublic) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      )
    }

    const weekDayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
    const availability = profile.availabilityRules.map((rule) => ({
      day: weekDayNames[rule.weekDay],
      hours: `${rule.startTime} - ${rule.endTime}`,
    }))

    const content = profile.contentPosts.map((post) => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content || "",
      type: post.type as "ARTICLE" | "VIDEO",
      videoUrl: post.videoUrl,
      attachmentUrl: post.attachmentUrl,
      date: post.publishedAt || post.createdAt,
    }))

    const formattedServices = profile.services.map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description || "",
      price: service.price ? Number(service.price) : 0,
      duration: service.duration || 60,
    }))

    const gradients = [
      "from-orange-500 via-amber-400 to-orange-600",
      "from-violet-600 via-purple-500 to-blue-600",
      "from-emerald-500 via-teal-400 to-cyan-600",
      "from-rose-500 via-pink-500 to-purple-600",
      "from-yellow-500 via-orange-400 to-red-500",
      "from-sky-500 via-blue-400 to-indigo-600",
    ]
    const hash = slug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const gradient = slug === 'leila-dos-santos-lopes-59837c'
      ? "from-[#5c061e] via-[#701a2b] to-[#9a2c41]"
      : gradients[hash % gradients.length]

    return NextResponse.json({
      professional: {
        name: profile.fullName,
        title: profile.title,
        specialty: profile.specialty,
        city: profile.city,
        state: profile.state,
        bio: profile.bio || "",
        approach: profile.approach || "",
        headline: profile.headline || "",
        whatsapp: profile.whatsapp,
        instagram: profile.instagram,
        website: profile.website,
        image: profile.profileImageUrl,
        rating: 4.9,
        reviews: 0,
        gradient,
        services: formattedServices,
        availability,
        content,
        businessCard: {
          phone: profile.businessCard?.phone,
          email: profile.businessCard?.email,
          website: profile.businessCard?.website || profile.website,
          instagram: profile.businessCard?.instagram || profile.instagram,
          facebook: profile.businessCard?.facebook,
          linkedin: profile.businessCard?.linkedin,
          youtube: profile.businessCard?.youtube,
          tiktok: profile.businessCard?.tiktok,
          address: profile.businessCard?.address,
          addressNumber: profile.businessCard?.addressNumber,
          addressComplement: profile.businessCard?.addressComplement,
          neighborhood: profile.businessCard?.neighborhood,
          city: profile.businessCard?.city || profile.city,
          state: profile.businessCard?.state || profile.state,
          zipCode: profile.businessCard?.zipCode,
          description: profile.businessCard?.description,
          services: (() => {
            const raw = profile.businessCard?.services
            if (!raw) return []
            try { return JSON.parse(raw) } catch { return [] }
          })(),
        },
      },
    })
  } catch (error) {
    logError('Professional slug GET', error)
    return NextResponse.json(
      { error: "Falha ao buscar profissional" },
      { status: 500 }
    )
  }
}
