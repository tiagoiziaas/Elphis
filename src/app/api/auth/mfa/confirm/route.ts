import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { verify } from 'otplib'
import { decryptField } from '@/lib/crypto'
import { PasswordService } from '@/lib/passwordService'
import { AuditLogger } from '@/lib/auditLogger'
import { randomBytes } from 'crypto'

function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 10; i++) {
    const code = randomBytes(4).toString('hex').toUpperCase()
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }
  return codes
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const { totpCode } = await request.json()

    if (!totpCode || typeof totpCode !== 'string') {
      return NextResponse.json({ error: 'Código de segurança é obrigatório' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (!user.mfaSecretEnc) {
      return NextResponse.json(
        { error: 'MFA não configurado nesta conta. Inicie o enrollment primeiro.' },
        { status: 400 }
      )
    }

    const decryptedSecret = decryptField(user.mfaSecretEnc)
    if (!decryptedSecret) {
      throw new Error('Falha ao descriptografar segredo do MFA')
    }

    const { valid: isTotpValid } = await verify({
      token: totpCode,
      secret: decryptedSecret,
    })

    if (!isTotpValid) {
      await AuditLogger.log({
        userId,
        eventType: 'MFA_CONFIRM_FAILED',
        payload: { email: user.email, reason: 'Código TOTP inválido durante a confirmação' },
      })
      return NextResponse.json({ error: 'Código de segurança inválido' }, { status: 400 })
    }

    // Sucesso TOTP! Gerar recovery codes
    const plainRecoveryCodes = generateBackupCodes()
    const hashedRecoveryCodes = await Promise.all(
      plainRecoveryCodes.map((code) => PasswordService.hash(code))
    )

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaRecoveryCodes: JSON.stringify(hashedRecoveryCodes),
      },
    })

    await AuditLogger.log({
      userId,
      eventType: 'MFA_CONFIRMED',
      payload: { email: user.email },
    })

    // Retorna os códigos em formato legível para o usuário salvar
    return NextResponse.json({
      success: true,
      recoveryCodes: plainRecoveryCodes,
    })
  } catch (error) {
    console.error('[MFA Confirm Error]', error)
    return NextResponse.json(
      { error: 'Não foi possível confirmar o MFA' },
      { status: 500 }
    )
  }
}
