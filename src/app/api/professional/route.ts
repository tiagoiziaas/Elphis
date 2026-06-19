import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import { logError } from '@/lib/logger'

const updateProfileSchema = z.object({
  fullName: z.string().min(3).max(150).trim().optional(),
  title: z.string().min(3).max(150).trim().optional(),
  specialty: z.string().min(3).max(150).trim().optional(),
  city: z.string().min(2).max(100).trim().optional(),
  state: z.string().min(2).max(100).trim().optional(),
  bio: z.string().max(3000).trim().optional(),
  approach: z.string().max(3000).trim().optional(),
  headline: z.string().max(300).trim().optional(),
  profileImageUrl: z.string().url().max(2000).optional().nullable(),
  coverImageUrl: z.string().url().max(2000).optional().nullable(),
  whatsapp: z.string().max(30).trim().optional().nullable(),
  instagram: z.string().max(100).trim().optional().nullable(),
  website: z.string().url().max(500).optional().nullable(),
  isPublic: z.boolean().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    const { data, error } = await supabase
      .from('professional_profiles')
      .update(validatedData)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      logError('Professional PATCH (Supabase)', error)
      return NextResponse.json({ error: 'Falha ao atualizar perfil' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso',
      profile: data,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      )
    }
    logError('Professional PATCH', error)
    return NextResponse.json({ error: 'Falha ao atualizar perfil' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('professional_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    const { data: services } = await supabase
      .from('professional_services')
      .select('*')
      .eq('professional_profile_id', profile.id)

    const { data: availabilityRules } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('professional_profile_id', profile.id)

    const { data: contentPosts } = await supabase
      .from('content_posts')
      .select('*')
      .eq('professional_profile_id', profile.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      profile: {
        ...profile,
        services: services || [],
        availabilityRules: availabilityRules || [],
        contentPosts: contentPosts || [],
      }
    })
  } catch (error) {
    logError('Professional GET', error)
    return NextResponse.json({ error: 'Falha ao buscar perfil' }, { status: 500 })
  }
}
