/**
 * Security helpers — transport, sanitization, and bot traps.
 */

export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return true
  return window.location.protocol === 'https:' || window.location.hostname === 'localhost'
}

/** Strip characters that could be used for HTML/script injection in stored text. */
export function sanitizeStoredText(input: string, maxLength = 10000): string {
  return input
    .trim()
    .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[<>]/g, '')
    .slice(0, maxLength)
}

/** Honeypot field name — bots often fill hidden "website" inputs. */
export const HONEYPOT_FIELD = 'companyWebsite'

export function isHoneypotTriggered(value: string | undefined | null): boolean {
  return Boolean(value && value.trim().length > 0)
}
