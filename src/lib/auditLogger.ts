import { prisma } from './prisma'
import { encryptField, decryptField, createHmac, timingSafeCompare } from './crypto'

export interface AuditLogPayload {
  [key: string]: any
}

export class AuditLogger {
  /**
   * Registra um novo evento de auditoria no banco de dados.
   * O payload é criptografado com AES-256-GCM e assinado com HMAC-SHA256.
   */
  static async log({
    userId,
    eventType,
    tableName,
    recordId,
    ipAddress,
    payload,
  }: {
    userId?: string | null
    eventType: string
    tableName?: string | null
    recordId?: string | null
    ipAddress?: string | null
    payload?: AuditLogPayload | null
  }) {
    try {
      const payloadStr = payload ? JSON.stringify(payload) : '{}'
      const payloadEnc = encryptField(payloadStr)
      if (!payloadEnc) {
        throw new Error('Falha ao criptografar o payload do log de auditoria')
      }

      const integrityMac = createHmac(payloadEnc)

      return await prisma.auditLog.create({
        data: {
          userId,
          eventType,
          tableName,
          recordId,
          ipAddress,
          payloadEnc,
          integrityMac,
        },
      })
    } catch (error) {
      // Em produção, falhas de logging de auditoria devem ser reportadas a sistemas secundários (ex: SIEM)
      // mas não devem derrubar a requisição do usuário (ou devem, dependendo da conformidade regulatória).
      // Aqui registramos no stderr para capturar via infraestrutura de logs.
      console.error('[AuditLogger Error] Failed to write audit log:', error)
    }
  }

  /**
   * Verifica a integridade de um log de auditoria comparando o HMAC assinado.
   * Se for válido, descriptografa o payload e o retorna.
   */
  static async verify(id: string): Promise<{
    isValid: boolean
    log: any
    decryptedPayload: AuditLogPayload | null
  }> {
    const log = await prisma.auditLog.findUnique({
      where: { id },
    })

    if (!log) {
      throw new Error(`Log de auditoria com ID ${id} não encontrado`)
    }

    const calculatedMac = createHmac(log.payloadEnc)
    const isValid = timingSafeCompare(log.integrityMac, calculatedMac)

    if (!isValid) {
      return {
        isValid: false,
        log,
        decryptedPayload: null,
      }
    }

    const decryptedStr = decryptField(log.payloadEnc)
    const decryptedPayload = decryptedStr ? JSON.parse(decryptedStr) : null

    return {
      isValid: true,
      log,
      decryptedPayload,
    }
  }
}
