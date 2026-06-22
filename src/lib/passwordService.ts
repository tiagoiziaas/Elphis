import { argon2id } from 'hash-wasm'
import { randomBytes, timingSafeEqual } from 'crypto'
import bcrypt from 'bcryptjs'

const ARGON2_PARAMS = {
  memorySize: 19456, // 19 MiB por thread ( OWASP 2024 )
  iterations: 2, // t
  parallelism: 1, // Lambda é single-thread
  hashLength: 32,
  saltLength: 16,
}

interface ParsedArgon2 {
  memorySize: number
  iterations: number
  parallelism: number
  salt: Uint8Array
}

function isBcryptHash(hashValue: string): boolean {
  return hashValue.startsWith('$2b$') || hashValue.startsWith('$2a$')
}

function base64ToBytes(b64: string): Uint8Array {
  const padded = b64 + '==='.slice((b64.length + 3) % 4)
  return new Uint8Array(Buffer.from(padded, 'base64'))
}

function parseArgon2Encoded(encoded: string): ParsedArgon2 | null {
  const match = encoded.match(
    /^\$argon2id\$v=\d+\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$?/,
  )
  if (!match) return null
  return {
    memorySize: parseInt(match[1], 10),
    iterations: parseInt(match[2], 10),
    parallelism: parseInt(match[3], 10),
    salt: base64ToBytes(match[4]),
  }
}

function needsRehash(encoded: string): boolean {
  const parsed = parseArgon2Encoded(encoded)
  if (!parsed) return true
  return (
    parsed.memorySize !== ARGON2_PARAMS.memorySize ||
    parsed.iterations !== ARGON2_PARAMS.iterations ||
    parsed.parallelism !== ARGON2_PARAMS.parallelism
  )
}

async function verifyArgon2(
  encoded: string,
  plainPassword: string,
): Promise<boolean> {
  const parsed = parseArgon2Encoded(encoded)
  if (!parsed) return false

  const computed = await argon2id({
    password: plainPassword,
    salt: parsed.salt,
    parallelism: parsed.parallelism,
    memorySize: parsed.memorySize,
    iterations: parsed.iterations,
    hashLength: ARGON2_PARAMS.hashLength,
    outputType: 'encoded',
  })

  const a = Buffer.from(encoded)
  const b = Buffer.from(computed)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export class PasswordService {
  static async hash(plainPassword: string): Promise<string> {
    const salt = new Uint8Array(
      randomBytes(ARGON2_PARAMS.saltLength),
    )
    return argon2id({
      password: plainPassword,
      salt,
      parallelism: ARGON2_PARAMS.parallelism,
      memorySize: ARGON2_PARAMS.memorySize,
      iterations: ARGON2_PARAMS.iterations,
      hashLength: ARGON2_PARAMS.hashLength,
      outputType: 'encoded',
    })
  }

  static async verify(
    hashValue: string,
    plainPassword: string,
  ): Promise<{ valid: boolean; needsRehash: boolean }> {
    try {
      if (isBcryptHash(hashValue)) {
        const valid = await bcrypt.compare(plainPassword, hashValue)
        return { valid, needsRehash: valid }
      }

      const valid = await verifyArgon2(hashValue, plainPassword)
      return { valid, needsRehash: valid ? needsRehash(hashValue) : false }
    } catch {
      return { valid: false, needsRehash: false }
    }
  }
}