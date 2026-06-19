import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { z } from "zod"
import { logError } from "@/lib/logger"

const appointmentSchema = z.object({
  professionalProfileId: z.string().min(1),
  serviceId: z.string().optional(),
  patientName: z.string().min(2).max(200).trim(),
  patientEmail: z.string().email().max(255),
  patientPhone: z.string().min(10).max(30).trim(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  notes: z.string().max(2000).trim().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = appointmentSchema.parse(body)

    const { data: professional } = await supabase
      .from("professional_profiles")
      .select("id")
      .eq("id", validatedData.professionalProfileId)
      .eq("is_public", true)
      .single()

    if (!professional) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      )
    }

    const { data: existingAppointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("professional_profile_id", validatedData.professionalProfileId)
      .eq("scheduled_date", validatedData.scheduledDate)
      .eq("scheduled_time", validatedData.scheduledTime)
      .in("status", ["SCHEDULED", "CONFIRMED"])
      .single()

    if (existingAppointment) {
      return NextResponse.json(
        { error: "Horário indisponível" },
        { status: 409 }
      )
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        professional_profile_id: validatedData.professionalProfileId,
        service_id: validatedData.serviceId,
        patient_name: validatedData.patientName,
        patient_email: validatedData.patientEmail,
        patient_phone: validatedData.patientPhone,
        scheduled_date: validatedData.scheduledDate,
        scheduled_time: validatedData.scheduledTime,
        notes: validatedData.notes,
        status: "SCHEDULED",
      })
      .select(`
        id,
        professional_profile_id,
        service_id,
        patient_name,
        patient_email,
        patient_phone,
        scheduled_date,
        scheduled_time,
        status,
        notes,
        professional_profiles (
          full_name,
          specialty
        ),
        professional_services (
          id,
          title,
          description,
          price,
          duration
        )
      `)
      .single()

    if (appointmentError) {
      logError('Appointment creation (Supabase)', appointmentError)
      return NextResponse.json(
        { error: "Falha ao criar agendamento" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Agendamento realizado com sucesso", appointment },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      )
    }
    logError('Appointments POST', error)
    return NextResponse.json(
      { error: "Falha ao criar agendamento" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const professionalProfileId = searchParams.get("professionalProfileId")

    if (!professionalProfileId) {
      return NextResponse.json(
        { error: "professionalProfileId é obrigatório" },
        { status: 400 }
      )
    }

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(`
        id,
        professional_profile_id,
        service_id,
        patient_name,
        patient_email,
        patient_phone,
        scheduled_date,
        scheduled_time,
        status,
        notes,
        professional_services (
          id,
          title,
          description,
          price,
          duration
        ),
        users (
          name,
          email
        )
      `)
      .eq("professional_profile_id", professionalProfileId)
      .order("scheduled_date", { ascending: true })

    if (error) {
      logError('Appointments GET (Supabase)', error)
      return NextResponse.json(
        { error: "Falha ao buscar agendamentos" },
        { status: 500 }
      )
    }

    return NextResponse.json({ appointments })
  } catch (error) {
    logError('Appointments GET', error)
    return NextResponse.json(
      { error: "Falha ao buscar agendamentos" },
      { status: 500 }
    )
  }
}
