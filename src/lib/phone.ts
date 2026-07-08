export const BOTSWANA_COUNTRY_CODE = '+267'

/** Strip to 8 local digits for storage and validation. */
export function normalizeBotswanaPhone(input: string | null | undefined): string {
  if (!input) return ''
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('267') && digits.length >= 11) return digits.slice(3, 11)
  if (digits.length > 8) return digits.slice(-8)
  return digits
}

/** Display as +267 73467206 */
export function formatBotswanaPhone(input: string | null | undefined): string {
  const digits = normalizeBotswanaPhone(input)
  if (digits.length !== 8) return input?.trim() || ''
  return `${BOTSWANA_COUNTRY_CODE} ${digits}`
}

/** tel: link with country code */
export function botswanaTelHref(input: string | null | undefined): string {
  const digits = normalizeBotswanaPhone(input)
  return digits ? `tel:+267${digits}` : ''
}
