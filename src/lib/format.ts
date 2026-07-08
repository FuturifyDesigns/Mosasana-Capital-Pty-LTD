/** Coerce Supabase NUMERIC (sometimes returned as string) to a number. */
export function toNumber(value: number | string | null | undefined): number {
  if (value == null || value === '') return 0
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

/**
 * Format Botswana Pula amounts with a space thousands separator (e.g. P 5 000)
 * so P 5 000 is never confused with P 50 000.
 */
export function formatPula(amount: number | string | null | undefined): string {
  const n = toNumber(amount)
  const formatted = Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `P ${formatted}`
}
