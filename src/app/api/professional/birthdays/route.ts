import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const professional = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!professional) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    const patients = await prisma.patient.findMany({
      where: {
        professionalProfileId: professional.id,
        dateOfBirth: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        profileImageUrl: true,
      },
    })

    const today = new Date()
    const todayMonth = today.getMonth()
    const todayDay = today.getDate()

    const upcoming: Array<{
      id: string
      name: string
      profileImageUrl: string | null
      dateOfBirth: string
      daysUntilBirthday: number
      birthdayThisYear: string
      age: number
      isToday: boolean
    }> = []

    for (const patient of patients) {
      if (!patient.dateOfBirth) continue

      const dob = new Date(patient.dateOfBirth)
      const birthMonth = dob.getMonth()
      const birthDay = dob.getDate()

      let birthdayThisYear = new Date(today.getFullYear(), birthMonth, birthDay)

      if (
        birthdayThisYear.getMonth() < todayMonth ||
        (birthdayThisYear.getMonth() === todayMonth && birthdayThisYear.getDate() < todayDay)
      ) {
        birthdayThisYear = new Date(today.getFullYear() + 1, birthMonth, birthDay)
      }

      const msUntil = birthdayThisYear.getTime() - new Date(today.getFullYear(), todayMonth, todayDay).getTime()
      const daysUntil = Math.round(msUntil / (1000 * 60 * 60 * 24))

      if (daysUntil <= 7) {
        const age = birthdayThisYear.getFullYear() - dob.getFullYear()
        upcoming.push({
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
          profileImageUrl: patient.profileImageUrl,
          dateOfBirth: patient.dateOfBirth.toISOString(),
          daysUntilBirthday: daysUntil,
          birthdayThisYear: birthdayThisYear.toISOString(),
          age,
          isToday: daysUntil === 0,
        })
      }
    }

    upcoming.sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday)

    return NextResponse.json({ birthdays: upcoming })
  } catch (error) {
    logError('Birthday reminders GET', error)
    return NextResponse.json({ error: 'Falha ao buscar aniversários' }, { status: 500 })
  }
}
