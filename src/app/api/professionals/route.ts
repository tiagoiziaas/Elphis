import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const rawLimit = searchParams.get('limit')
    const limit = rawLimit ? Math.min(Math.max(parseInt(rawLimit, 10) || 50, 1), 100) : 50
    const specialty = searchParams.get('specialty')
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const search = searchParams.get('search')

    const where: any = { isPublic: true }

    if (specialty) {
      where.specialty = { contains: specialty, mode: 'insensitive' }
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }

    if (state) {
      where.state = state
    }

    if (search) {
      where.AND = [
        { isPublic: true },
        {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { specialty: { contains: search, mode: 'insensitive' } },
            { title: { contains: search, mode: 'insensitive' } },
          ],
        },
      ]
      delete where.isPublic
    }

    const data = await prisma.professionalProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        slug: true,
        fullName: true,
        title: true,
        specialty: true,
        city: true,
        state: true,
        profileImageUrl: true,
        isPublic: true,
      },
    })

    const professionals = data
      .filter((pro) => pro.isPublic)
      .map((pro) => ({
        id: pro.id,
        slug: pro.slug,
        name: pro.fullName,
        title: pro.title,
        specialty: pro.specialty,
        city: pro.city,
        state: pro.state,
        image: pro.profileImageUrl,
      }))

    return NextResponse.json({ professionals })
  } catch (error) {
    logError('Professionals API', error)
    return NextResponse.json({ error: 'Falha ao buscar profissionais' }, { status: 500 })
  }
}
