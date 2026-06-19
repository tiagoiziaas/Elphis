import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual, createHmac as nodeCreateHmac } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY inválida ou ausente no .env (deve ter 64 caracteres hex)')
  }
  return Buffer.from(key, 'hex')
}

export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext === null || plaintext === undefined || plaintext === '') return null

  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decryptField(ciphertext: string | null | undefined): string | null {
  if (ciphertext === null || ciphertext === undefined || ciphertext === '') return null

  try {
    const key = getEncryptionKey()
    const data = Buffer.from(ciphertext, 'base64')

    const iv = data.subarray(0, IV_LENGTH)
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    return null
  }
}

export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false
  try {
    const data = Buffer.from(value, 'base64')
    return data.length > IV_LENGTH + AUTH_TAG_LENGTH
  } catch {
    return false
  }
}

export function timingSafeCompare(a: string, b: string): boolean {
  const secret = process.env.AUDIT_HMAC_SECRET || 'fallback-secret'
  const hmacA = nodeCreateHmac('sha256', secret).update(a).digest()
  const hmacB = nodeCreateHmac('sha256', secret).update(b).digest()
  return timingSafeEqual(hmacA, hmacB)
}

export function createHmac(data: string): string {
  const secret = process.env.AUDIT_HMAC_SECRET
  if (!secret) {
    throw new Error('AUDIT_HMAC_SECRET não configurado no .env')
  }
  return nodeCreateHmac('sha256', secret).update(data).digest('hex')
}

