const isProd = process.env.NODE_ENV === 'production'

export function logError(context: string, error: unknown): void {
  if (!isProd) {
    console.error(`[${context}]`, error)
  }
}
