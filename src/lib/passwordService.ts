import { hash, verify } from '@node-rs/argon2'
import bcrypt from 'bcryptjs'

const ARGON2_OPTIONS = {
  algorithm: 2 as const, // Algorithm.Argon2id
  memoryCost: 19456, // 19 MiB por thread ( recomendado OWASP 2024 )
  timeCost: 2,
  parallelism: 1, // Lambda é single-thread ; paralelismo só multiplicaria memória
  outputLen: 32,
}

function isBcryptHash(hashValue: string): boolean {
  return hashValue.startsWith('$2b$') || hashValue.startsWith('$2a$')
}

function parseArgon2Params(
  encoded: string,
): { memoryCost: number; timeCost: number; parallelism: number } | null {
  const match = encoded.match(/\$argon2id?\$v=\d+\$m=(\d+),t=(\d+),p=(\d+)/)
  if (!match) return null
  return {
    memoryCost: parseInt(match[1], 10),
    timeCost: parseInt(match[2], 10),
    parallelism: parseInt(match[3], 10),
  }
}

function needsRehash(
  encoded: string,
  options: typeof ARGON2_OPTIONS,
): boolean {
  const parsed = parseArgon2Params(encoded)
  if (!parsed) return true
  return (
    parsed.memoryCost !== options.memoryCost ||
    parsed.timeCost !== options.timeCost ||
    parsed.parallelism !== options.parallelism
  )
}

export class PasswordService {
  static async hash(plainPassword: string): Promise<string> {
    return hash(plainPassword, ARGON2_OPTIONS)
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

      const valid = await verify(hashValue, plainPassword)
      const rehash = valid ? needsRehash(hashValue, ARGON2_OPTIONS) : false
      return { valid, needsRehash: rehash }
    } catch {
      return { valid: false, needsRehash: false }
    }
  }
}