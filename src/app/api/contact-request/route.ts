import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import { checkRegisterRateLimit } from '@/lib/rateLimiter'

const contactRequestSchema = z.object({
  nome: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255).toLowerCase().trim(),
  whatsapp: z.string().min(8).max(20).trim(),
  professional_slug: z.string().min(1).max(200).trim(),
  data_preferida: z.string().optional().nullable(),
  horario: z.string().max(10).optional().nullable(),
  mensagem: z.string().max(1000).trim().optional().nullable(),
})

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRegisterRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const validated = contactRequestSchema.parse(body)

    const { data, error } = await supabase
      .from('contact_requests')
      .insert([{
        professional_slug: validated.professional_slug,
        nome: validated.nome,
        email: validated.email,
        whatsapp: validated.whatsapp,
        data_preferida: validated.data_preferida || null,
        horario: validated.horario || null,
        mensagem: validated.mensagem || null,
        status: 'PENDENTE',
      }])
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Falha ao registrar solicitação.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
