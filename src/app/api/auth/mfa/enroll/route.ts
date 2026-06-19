import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { generateSecret, generateURI } from 'otplib'
import { encryptField } from '@/lib/crypto'
import { AuditLogger } from '@/lib/auditLogger'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Gerar um secret TOTP seguro
    const secret = generateSecret()
    
    // Configurar o issuer para exibição no aplicativo autenticador
    const issuer = process.env.MFA_ISSUER || 'Elphis'
    const otpauthUrl = generateURI({
      secret,
      label: user.email,
      issuer,
    })

    // Criptografar o secret antes de persistir
    const mfaSecretEnc = encryptField(secret)
    if (!mfaSecretEnc) {
      throw new Error('Erro ao criptografar o segredo do MFA')
    }

    // Salvar o secret criptografado mas manter mfaEnabled=false até confirmação
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecretEnc,
      },
    })

    await AuditLogger.log({
      userId,
      eventType: 'MFA_ENROLL_INITIATED',
      payload: { email: user.email },
    })

    return NextResponse.json({
      secret,
      otpauthUrl,
    })
  } catch (error) {
    console.error('[MFA Enroll Error]', error)
    return NextResponse.json(
      { error: 'Não foi possível iniciar a configuração do MFA' },
      { status: 500 }
    )
  }
}
