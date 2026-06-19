import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PasswordService } from '@/lib/passwordService'
import { AuditLogger } from '@/lib/auditLogger'
import { z } from 'zod'
import { checkRegisterRateLimit } from '@/lib/rateLimiter'
import { randomBytes } from 'crypto'

const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128)
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número'),
  role: z.enum(['PATIENT', 'PROFESSIONAL']),
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
        payload: { email: validatedData.email },
      })
      return NextResponse.json(
        { error: 'Não foi possível criar a conta com esses dados.' },
        { status: 400 }
      )
    }

    const passwordHash = await PasswordService.hash(validatedData.password)

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        role: validatedData.role,
      },
    })

    await AuditLogger.log({
      userId: user.id,
      eventType: 'USER_REGISTERED',
      payload: { email: user.email, role: user.role },
    })

    if (validatedData.role === 'PROFESSIONAL') {
      const baseSlug = validatedData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const uniqueSuffix = randomBytes(3).toString('hex')
      const slug = `${baseSlug}-${uniqueSuffix}`

      await prisma.professionalProfile.create({
        data: {
          userId: user.id,
          slug,
          fullName: validatedData.name,
          specialty: 'Especialidade',
          city: 'Cidade',
          state: 'Estado',
        },
      })
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Não foi possível criar a conta.' },
      { status: 500 }
    )
  }
}
