import argon2 from 'argon2'
import bcrypt from 'bcryptjs'

/**
 * Parâmetros OWASP 2024 para Argon2id.
 * - memoryCost: 64 MB — resistência a ataques de GPU/ASIC
 * - timeCost: 3 iterações
 * - parallelism: 4 threads
 */
const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3,
  parallelism: 4,
  hashLength: 32,
}

/**
 * Detecta se um hash foi gerado com bcrypt (começa com $2b$ ou $2a$).
 * Usado para backward-compatibility com senhas antigas.
 */
function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2b$') || hash.startsWith('$2a$')
}

export class PasswordService {
  /**
   * Gera hash Argon2id da senha.
   * Argon2 inclui salt aleatório automaticamente — não passe salt externo.
   */
  static async hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, ARGON2_OPTIONS)
  }

  /**
   * Verifica a senha contra o hash armazenado.
   * Suporta hashes bcrypt legados (backward-compatible) e Argon2id novos.
   * Retorna { valid, needsRehash } — se needsRehash=true, re-hash na próxima autenticação.
   */
  static async verify(
    hash: string,
    plainPassword: string
  ): Promise<{ valid: boolean; needsRehash: boolean }> {
    try {
      // Hash bcrypt legado → usa bcryptjs para verificar
      if (isBcryptHash(hash)) {
        const valid = await bcrypt.compare(plainPassword, hash)
        // Sempre pede re-hash para migrar para Argon2id
        return { valid, needsRehash: valid }
      }

      // Hash Argon2id → verificação normal
      const valid = await argon2.verify(hash, plainPassword)
      // Verifica se os parâmetros de custo precisam ser atualizados
      const needsRehash = valid ? argon2.needsRehash(hash, ARGON2_OPTIONS) : false
      return { valid, needsRehash }
    } catch {
      // Hash malformado ou algoritmo desconhecido → nega acesso sem vazar informação
      return { valid: false, needsRehash: false }
    }
  }
}
