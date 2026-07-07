// Lightweight client-side rate limiting to curb accidental spam / rapid resubmits.
// This is a UX guard on top of Supabase's built-in server-side auth rate limits —
// it is NOT a substitute for server-side protection, but it stops obvious abuse
// from a single browser (e.g. hammering the submit button).

type RateResult = { allowed: boolean; retryAfterMs: number }

const PREFIX = 'rl:'

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): RateResult {
  if (typeof window === 'undefined') return { allowed: true, retryAfterMs: 0 }

  const storageKey = PREFIX + key
  const now = Date.now()

  let timestamps: number[] = []
  try {
    timestamps = JSON.parse(localStorage.getItem(storageKey) || '[]')
  } catch {
    timestamps = []
  }

  // Keep only attempts still inside the window
  timestamps = timestamps.filter((t) => now - t < windowMs)

  if (timestamps.length >= maxAttempts) {
    const oldest = timestamps[0]
    return { allowed: false, retryAfterMs: windowMs - (now - oldest) }
  }

  timestamps.push(now)
  try {
    localStorage.setItem(storageKey, JSON.stringify(timestamps))
  } catch {
    /* ignore storage errors */
  }
  return { allowed: true, retryAfterMs: 0 }
}

export function rateLimitMessage(retryAfterMs: number): string {
  const seconds = Math.ceil(retryAfterMs / 1000)
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60)
    return `Too many attempts. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} and try again.`
  }
  return `Too many attempts. Please wait ${seconds} second${seconds > 1 ? 's' : ''} and try again.`
}
