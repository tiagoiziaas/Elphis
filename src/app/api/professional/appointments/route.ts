import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logError } from '@/lib/logger'

const appointmentStatusEnum = z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const professional = await prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
      include: { availabilityRules: true },
    })

    if (!professional) {
      return NextResponse.json({ error: 'Perfil profissional não encontrado' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')

    const where: any = { professionalProfileId: professional.id }

    if (status) {
      const parsedStatus = appointmentStatusEnum.safeParse(status.toUpperCase())
      if (parsedStatus.success) {
        where.status = parsedStatus.data
      }
    }

    const queryOptions: any = {
      where,
      include: { service: true },
      orderBy: [
        { scheduledDate: 'asc' as const },
        { scheduledTime: 'asc' as const },
      ],
    }

    if (limit) {
      const parsedLimit = parseInt(limit, 10)
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 200) {
        queryOptions.take = parsedLimit
      }
    }

    const appointments = await prisma.appointment.findMany(queryOptions)

    const availability = professional.availabilityRules.map((rule) => ({
      id: rule.id,
      weekDay: rule.weekDay,
      startTime: rule.startTime,
      endTime: rule.endTime,
      active: rule.active,
    }))

    return NextResponse.json({
      appointments: appointments.map((apt) => ({
        id: apt.id,
        patient: apt.patientName,
        patientEmail: apt.patientEmail,
        patientPhone: apt.patientPhone,
        date: new Date(apt.scheduledDate).toISOString(),
        time: apt.scheduledTime,
        endTime: apt.scheduledEndTime,
        type: (apt as any).service?.title || 'Consulta',
        status: apt.status.toLowerCase(),
        value: apt.consultationValue
          ? Number(apt.consultationValue)
          : (apt as any).service?.price
          ? Number((apt as any).service.price)
          : 0,
        notes: apt.notes,
        serviceId: apt.serviceId,
        attendanceType: apt.attendanceType,
        patientRecordId: apt.patientRecordId,
      })),
      availability,
    })
  } catch (error) {
    logError('Appointments GET', error)
    return NextResponse.json({ error: 'Falha ao buscar agendamentos' }, { status: 500 })
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

    const body = await request.json()

    if (!body.scheduledDate) {
      return NextResponse.json({ error: 'Data do agendamento é obrigatória' }, { status: 400 })
    }

    if (!body.scheduledTime) {
      return NextResponse.json({ error: 'Horário do agendamento é obrigatório' }, { status: 400 })
    }

    if (!body.patientName && !body.patientRecordId) {
      return NextResponse.json({ error: 'Nome do paciente ou ID do registro é obrigatório' }, { status: 400 })
    }

    const scheduledDate = new Date(body.scheduledDate)
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'Data inválida. Use o formato YYYY-MM-DD' }, { status: 400 })
    }

    const status = body.status
      ? appointmentStatusEnum.safeParse(body.status.toUpperCase()).data ?? 'PENDING'
      : 'PENDING'

    const appointment = await prisma.appointment.create({
      data: {
        professionalProfileId: professional.id,
        patientName: body.patientName || 'Paciente não identificado',
        patientEmail: body.patientEmail || '',
        patientPhone: body.patientPhone || '',
        serviceId: body.serviceId,
        scheduledDate,
        scheduledTime: body.scheduledTime,
        scheduledEndTime: body.scheduledEndTime,
        status,
        notes: body.notes,
        consultationValue: body.consultationValue,
        attendanceType: body.attendanceType || 'IN_PERSON',
        patientRecordId: body.patientRecordId,
      },
      include: { service: true },
    })

    return NextResponse.json({
      id: appointment.id,
      patient: appointment.patientName,
      patientEmail: appointment.patientEmail,
      patientPhone: appointment.patientPhone,
      date: new Date(appointment.scheduledDate).toISOString(),
      time: appointment.scheduledTime,
      endTime: appointment.scheduledEndTime,
      type: (appointment as any).service?.title || 'Consulta',
      status: appointment.status.toLowerCase(),
      value: appointment.consultationValue
        ? Number(appointment.consultationValue)
        : (appointment as any).service?.price
        ? Number((appointment as any).service.price)
        : 0,
      notes: appointment.notes,
      attendanceType: appointment.attendanceType,
      patientRecordId: appointment.patientRecordId,
    })
  } catch (error) {
    logError('Appointments POST', error)
    return NextResponse.json({ error: 'Falha ao criar agendamento' }, { status: 500 })
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
    const appointmentId = body.id

    if (!appointmentId) {
      return NextResponse.json({ error: 'ID do agendamento obrigatório' }, { status: 400 })
    }

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!existingAppointment || existingAppointment.professionalProfileId !== professional.id) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
    }

    const updatedData: any = {}

    if (body.status) {
      const parsed = appointmentStatusEnum.safeParse(body.status.toUpperCase())
      if (parsed.success) updatedData.status = parsed.data
    }
    if (body.scheduledDate) updatedData.scheduledDate = new Date(body.scheduledDate)
    if (body.scheduledTime) updatedData.scheduledTime = body.scheduledTime
    if (body.scheduledEndTime) updatedData.scheduledEndTime = body.scheduledEndTime
    if (body.notes !== undefined) updatedData.notes = body.notes
    if (body.serviceId) updatedData.serviceId = body.serviceId
    if (body.consultationValue !== undefined) updatedData.consultationValue = body.consultationValue
    if (body.attendanceType) updatedData.attendanceType = body.attendanceType
    if (body.patientRecordId) updatedData.patientRecordId = body.patientRecordId

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updatedData,
      include: { service: true },
    })

    return NextResponse.json({
      id: appointment.id,
      patient: appointment.patientName,
      patientEmail: appointment.patientEmail,
      patientPhone: appointment.patientPhone,
      date: new Date(appointment.scheduledDate).toISOString(),
      time: appointment.scheduledTime,
      endTime: appointment.scheduledEndTime,
      type: (appointment as any).service?.title || 'Consulta',
      status: appointment.status.toLowerCase(),
      value: appointment.consultationValue
        ? Number(appointment.consultationValue)
        : (appointment as any).service?.price
        ? Number((appointment as any).service.price)
        : 0,
      notes: appointment.notes,
      attendanceType: appointment.attendanceType,
      patientRecordId: appointment.patientRecordId,
    })
  } catch (error) {
    logError('Appointments PUT', error)
    return NextResponse.json({ error: 'Falha ao atualizar agendamento' }, { status: 500 })
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
    const appointmentId = searchParams.get('id')

    if (!appointmentId) {
      return NextResponse.json({ error: 'ID do agendamento obrigatório' }, { status: 400 })
    }

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!existingAppointment || existingAppointment.professionalProfileId !== professional.id) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
    }

    await prisma.appointment.delete({ where: { id: appointmentId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logError('Appointments DELETE', error)
    return NextResponse.json({ error: 'Falha ao deletar agendamento' }, { status: 500 })
  }
}
