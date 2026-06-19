import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { PasswordService } from '@/lib/passwordService'
import { AuditLogger } from '@/lib/auditLogger'
import { decryptField } from '@/lib/crypto'
import { verify } from 'otplib'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totpCode: { label: 'Código MFA', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciais inválidas')
        }

        const email = credentials.email.toLowerCase().trim()

        const userWithProfile = await prisma.user.findUnique({
          where: { email },
          include: {
            professionalProfile: true,
          },
        })

        if (!userWithProfile) {
          // Auditoria: falha de login (usuário inexistente)
          await AuditLogger.log({
            eventType: 'AUTH_FAILED_LOGIN',
            payload: { email, reason: 'Usuário não cadastrado' },
          })
          throw new Error('Credenciais inválidas')
        }

        // Account Lockout Check
        if (userWithProfile.lockedUntil && userWithProfile.lockedUntil > new Date()) {
          await AuditLogger.log({
            userId: userWithProfile.id,
            eventType: 'AUTH_LOCKED_OUT',
            payload: { email: userWithProfile.email },
          })
          throw new Error('Conta temporariamente bloqueada. Tente novamente mais tarde.')
        }

        // Verificar Senha
        const { valid: isPasswordValid, needsRehash } = await PasswordService.verify(
          userWithProfile.passwordHash,
          credentials.password
        )

        if (!isPasswordValid) {
          const failedAttempts = userWithProfile.failedAttempts + 1
          const shouldLock = failedAttempts >= 5
          const lockedUntil = shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null

          await prisma.user.update({
            where: { id: userWithProfile.id },
            data: {
              failedAttempts,
              lockedUntil,
            },
          })

          await AuditLogger.log({
            userId: userWithProfile.id,
            eventType: 'AUTH_FAILED_LOGIN',
            payload: {
              email: userWithProfile.email,
              reason: 'Senha incorreta',
              failedAttempts,
              accountLocked: shouldLock,
            },
          })

          if (shouldLock) {
            throw new Error('Conta bloqueada por excesso de tentativas falhas (15 minutos).')
          }
          throw new Error('Credenciais inválidas')
        }

        // Verificar MFA se habilitado
        if (userWithProfile.mfaEnabled) {
          if (!credentials.totpCode) {
            // Lançar um erro estruturado que o frontend reconhecerá para abrir o prompt do MFA
            throw new Error('MFA_REQUIRED')
          }

          if (!userWithProfile.mfaSecretEnc) {
            await AuditLogger.log({
              userId: userWithProfile.id,
              eventType: 'AUTH_MFA_ERROR',
              payload: { email: userWithProfile.email, reason: 'MFA habilitado mas sem secret' },
            })
            throw new Error('Erro de configuração do MFA na conta')
          }

          const decryptedSecret = decryptField(userWithProfile.mfaSecretEnc)
          if (!decryptedSecret) {
            await AuditLogger.log({
              userId: userWithProfile.id,
              eventType: 'AUTH_MFA_ERROR',
              payload: { email: userWithProfile.email, reason: 'Falha ao descriptografar secret MFA' },
            })
            throw new Error('Erro ao descriptografar chave de segurança')
          }

          const { valid: isTotpValid } = await verify({
            token: credentials.totpCode,
            secret: decryptedSecret,
          })

          if (!isTotpValid) {
            // Contabilizar falha de MFA no lockout
            const failedAttempts = userWithProfile.failedAttempts + 1
            const shouldLock = failedAttempts >= 5
            const lockedUntil = shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null

            await prisma.user.update({
              where: { id: userWithProfile.id },
              data: {
                failedAttempts,
                lockedUntil,
              },
            })

            await AuditLogger.log({
              userId: userWithProfile.id,
              eventType: 'AUTH_FAILED_MFA',
              payload: {
                email: userWithProfile.email,
                reason: 'Código MFA incorreto',
                failedAttempts,
                accountLocked: shouldLock,
              },
            })

            if (shouldLock) {
              throw new Error('Conta bloqueada por excesso de tentativas falhas (15 minutos).')
            }
            throw new Error('Código de segurança inválido')
          }
        }

        // Sucesso na Autenticação!
        // Resetar lockout
        if (userWithProfile.failedAttempts > 0 || userWithProfile.lockedUntil) {
          await prisma.user.update({
            where: { id: userWithProfile.id },
            data: {
              failedAttempts: 0,
              lockedUntil: null,
            },
          })
        }

        // Migração de hash gradual (Bcrypt -> Argon2id)
        if (needsRehash) {
          const newHash = await PasswordService.hash(credentials.password)
          await prisma.user.update({
            where: { id: userWithProfile.id },
            data: { passwordHash: newHash },
          })
          await AuditLogger.log({
            userId: userWithProfile.id,
            eventType: 'SECURITY_PASSWORD_REHASHED',
            payload: { email: userWithProfile.email, algorithm: 'Argon2id' },
          })
        }

        await AuditLogger.log({
          userId: userWithProfile.id,
          eventType: 'AUTH_SUCCESS_LOGIN',
          payload: { email: userWithProfile.email, mfaUsed: userWithProfile.mfaEnabled },
        })

        const profile = userWithProfile.professionalProfile

        return {
          id: userWithProfile.id,
          email: userWithProfile.email,
          name: userWithProfile.name,
          role: userWithProfile.role,
          professionalProfile: profile
            ? {
                id: profile.id,
                slug: profile.slug,
                fullName: profile.fullName,
                title: profile.title,
                specialty: profile.specialty,
                city: profile.city,
                state: profile.state,
                bio: profile.bio,
                approach: profile.approach,
                headline: profile.headline,
                profileImageUrl: profile.profileImageUrl,
                coverImageUrl: profile.coverImageUrl,
                whatsapp: profile.whatsapp,
                instagram: profile.instagram,
                website: profile.website,
                isPublic: profile.isPublic,
              }
            : null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.professionalProfile = user.professionalProfile
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.professionalProfile = token.professionalProfile
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
    updateAge: 2 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}
