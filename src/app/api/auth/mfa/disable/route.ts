import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'
import { verify } from 'otplib'
import { decryptField } from '@/lib/crypto'
import { PasswordService } from '@/lib/passwordService'
import { AuditLogger } from '@/lib/auditLogger'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const { totpCode, recoveryCode, password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'A senha é obrigatória para desativar o MFA' }, { status: 400 })
    }

    if (!totpCode && !recoveryCode) {
      return NextResponse.json(
        { error: 'É necessário fornecer o código MFA ou um código de recuperação' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // 1. Confirmar a senha do usuário primeiro (dupla confirmação)
    const { valid: isPasswordValid } = await PasswordService.verify(user.passwordHash, password)
    if (!isPasswordValid) {
      await AuditLogger.log({
        userId,
        eventType: 'MFA_DISABLE_FAILED',
        payload: { email: user.email, reason: 'Senha incorreta' },
      })
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 400 })
    }

    // 2. Confirmar fator MFA ou Código de Recuperação
    let isSecondFactorValid = false
    let updatedRecoveryCodesStr: string | null = user.mfaRecoveryCodes

    if (totpCode) {
      if (!user.mfaSecretEnc) {
        return NextResponse.json({ error: 'MFA não configurado nesta conta' }, { status: 400 })
      }

      const decryptedSecret = decryptField(user.mfaSecretEnc)
      if (!decryptedSecret) {
        throw new Error('Falha ao descriptografar segredo do MFA')
      }

      const { valid: isTotpValid } = await verify({
        token: totpCode,
        secret: decryptedSecret,
      })
      isSecondFactorValid = isTotpValid
    } else if (recoveryCode) {
      if (!user.mfaRecoveryCodes) {
        return NextResponse.json({ error: 'Códigos de recuperação não disponíveis' }, { status: 400 })
      }

      const recoveryCodesList: string[] = JSON.parse(user.mfaRecoveryCodes)
      let matchedIndex = -1

      // Procurar qual hash bate com o código inserido
      for (let i = 0; i < recoveryCodesList.length; i++) {
        const { valid } = await PasswordService.verify(recoveryCodesList[i], recoveryCode)
        if (valid) {
          matchedIndex = i
          break
        }
      }

      if (matchedIndex !== -1) {
        isSecondFactorValid = true
        // Remover código de recuperação utilizado (Single-Use)
        recoveryCodesList.splice(matchedIndex, 1)
        updatedRecoveryCodesStr = JSON.stringify(recoveryCodesList)
      }
    }

    if (!isSecondFactorValid) {
      await AuditLogger.log({
        userId,
        eventType: 'MFA_DISABLE_FAILED',
        payload: { email: user.email, reason: totpCode ? 'Código MFA inválido' : 'Código de recuperação inválido' },
      })
      return NextResponse.json(
        { error: totpCode ? 'Código MFA inválido' : 'Código de recuperação inválido ou já utilizado' },
        { status: 400 }
      )
    }

    // 3. Desativar MFA se tudo estiver correto
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecretEnc: null,
        mfaRecoveryCodes: null, // Limpa os códigos antigos
      },
    })

    await AuditLogger.log({
      userId,
      eventType: 'MFA_DISABLED',
      payload: { email: user.email, method: totpCode ? 'TOTP' : 'Recovery Code' },
    })

    return NextResponse.json({
      success: true,
      message: 'MFA desativado com sucesso',
    })
  } catch (error) {
    console.error('[MFA Disable Error]', error)
    return NextResponse.json(
      { error: 'Não foi possível desativar o MFA' },
      { status: 500 }
    )
  }
}
