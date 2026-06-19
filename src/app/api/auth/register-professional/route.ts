import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PasswordService } from '@/lib/passwordService'
import { AuditLogger } from '@/lib/auditLogger'
import { z } from 'zod'
import { checkRegisterRateLimit } from '@/lib/rateLimiter'
import { randomBytes } from 'crypto'

const registerSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128)
    .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter ao menos um número'),
  specialty: z.string().min(3).max(100).trim(),
  title: z.string().min(3).max(100).trim(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().min(2).max(50).trim(),
  councilType: z.string().max(20).trim().optional(),
  councilNumber: z.string().max(30).trim().optional(),
})

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRegisterRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      await AuditLogger.log({
        eventType: 'AUTH_REGISTER_ATTEMPT_DUPLICATE',
        payload: { email: validatedData.email, type: 'PROFESSIONAL' },
      })
      return NextResponse.json(
        { message: 'Não foi possível criar a conta com esses dados.' },
        { status: 400 }
      )
    }

    const passwordHash = await PasswordService.hash(validatedData.password)

    const baseSlug = validatedData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const uniqueSuffix = randomBytes(3).toString('hex')
    const slug = `${baseSlug}-${uniqueSuffix}`

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        role: 'PROFESSIONAL',
        professionalProfile: {
          create: {
            slug,
            fullName: validatedData.name,
            title: validatedData.title,
            specialty: validatedData.specialty,
            city: validatedData.city,
            state: validatedData.state,
            isPublic: true,
            ...(validatedData.councilType && { councilType: validatedData.councilType }),
            ...(validatedData.councilNumber && { councilNumber: validatedData.councilNumber }),
          },
        },
      },
      include: {
        professionalProfile: true,
      },
    })

    await AuditLogger.log({
      userId: user.id,
      eventType: 'USER_REGISTERED',
      payload: { email: user.email, role: 'PROFESSIONAL', specialty: validatedData.specialty },
    })

    return NextResponse.json({
      message: 'Conta criada com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Não foi possível criar a conta.' },
      { status: 500 }
    )
  }
}
