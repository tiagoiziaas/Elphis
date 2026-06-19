import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'
import { logError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const qMonth = searchParams.get('month')
    const qYear = searchParams.get('year')

    const now = new Date()
    const targetDate =
      qMonth !== null && qYear !== null
        ? new Date(parseInt(qYear, 10), parseInt(qMonth, 10), 1)
        : now

    const monthStart = startOfMonth(targetDate)
    const monthEnd = endOfMonth(targetDate)

    const professional = await (prisma.professionalProfile as any).findUnique({
      where: { userId: session.user.id },
      include: {
        services: true,
        appointments: {
          include: { service: true },
        },
      },
    })

    if (!professional) {
      return NextResponse.json({ error: 'Perfil profissional não encontrado' }, { status: 404 })
    }

    const defaultValue = professional.defaultConsultationValue
      ? Number(professional.defaultConsultationValue)
      : 0

    const getAppointmentValue = (apt: any): number => {
      if (apt.consultationValue) return Number(apt.consultationValue)
      if (apt.service?.price) return Number(apt.service.price)
      return defaultValue
    }

    const monthAppointments = (professional.appointments as any[]).filter((apt: any) => {
      const aptDate = new Date(apt.scheduledDate)
      return aptDate >= monthStart && aptDate <= monthEnd
    })

    const completedAppointments = monthAppointments.filter((apt: any) => apt.status === 'COMPLETED')
    const confirmedAppointments = monthAppointments.filter((apt: any) => apt.status === 'CONFIRMED')
    const pendingAppointments = monthAppointments.filter((apt: any) => apt.status === 'PENDING')

    const billableAppointments = [...completedAppointments, ...confirmedAppointments]
    const revenue = billableAppointments.reduce(
      (acc: number, apt: any) => acc + getAppointmentValue(apt),
      0
    )

    const uniquePatients = new Map(
      (monthAppointments as any[]).map((apt: any) => [apt.patientEmail, apt])
    )

    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const upcomingAppointments = (professional.appointments as any[])
      .filter((apt: any) => {
        const aptDate = new Date(apt.scheduledDate)
        return aptDate >= now && aptDate <= sevenDaysFromNow && apt.status !== 'CANCELLED'
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      )
      .slice(0, 5)

    const recentPatients = (monthAppointments as any[])
      .filter((apt: any) => apt.status === 'COMPLETED' || apt.status === 'CONFIRMED')
      .sort(
        (a: any, b: any) =>
          new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
      )
      .slice(0, 10)

    const uniquePatientsMap = new Map()
    recentPatients.forEach((apt: any) => {
      if (!uniquePatientsMap.has(apt.patientEmail)) {
        uniquePatientsMap.set(apt.patientEmail, {
          id: apt.patientId || apt.id,
          name: apt.patientName,
          email: apt.patientEmail,
          phone: apt.patientPhone,
          lastAppointment: apt.scheduledDate,
          totalAppointments: (professional.appointments as any[]).filter(
            (a: any) => a.patientEmail === apt.patientEmail
          ).length,
        })
      }
    })

    const billingClients = Array.from(uniquePatientsMap.values()).map((patient: any) => {
      const patientAppointments = (professional.appointments as any[]).filter(
        (apt: any) => apt.patientEmail === patient.email
      )
      const monthPatientAppointments = patientAppointments.filter((apt: any) => {
        const aptDate = new Date(apt.scheduledDate)
        return aptDate >= monthStart && aptDate <= monthEnd
      })

      const attended = monthPatientAppointments.some((apt: any) => apt.status === 'COMPLETED')
      const sessions = monthPatientAppointments.length
      const totalValue = monthPatientAppointments.reduce(
        (acc: number, apt: any) => acc + getAppointmentValue(apt),
        0
      )

      return {
        id: patient.id,
        name: patient.name,
        specialty: patientAppointments[0]?.service?.title || 'Consulta',
        sessions,
        value: sessions > 0 ? totalValue / sessions : defaultValue,
        attended,
        lastSession: patient.lastAppointment,
      }
    })

    return NextResponse.json({
      stats: {
        monthAppointments: monthAppointments.length,
        completedAppointments: completedAppointments.length,
        confirmedAppointments: confirmedAppointments.length,
        pendingAppointments: pendingAppointments.length,
        totalPatients: uniquePatients.size,
        revenue,
        rating: 4.9,
        ratingCount: 127,
      },
      upcomingAppointments: (upcomingAppointments as any[]).map((apt: any) => ({
        id: apt.id,
        patient: apt.patientName,
        patientEmail: apt.patientEmail,
        patientPhone: apt.patientPhone,
        date: new Date(apt.scheduledDate).toISOString(),
        time: apt.scheduledTime,
        type: apt.service?.title || 'Consulta',
        status: apt.status.toLowerCase(),
        value: apt.consultationValue
          ? Number(apt.consultationValue)
          : apt.service?.price
          ? Number(apt.service.price)
          : defaultValue,
        notes: apt.notes,
      })),
      billingClients,
      recentPatients: Array.from(uniquePatientsMap.values()),
    })
  } catch (error) {
    logError('Dashboard API', error)
    return NextResponse.json({ error: 'Falha ao buscar dados do dashboard' }, { status: 500 })
  }
}
