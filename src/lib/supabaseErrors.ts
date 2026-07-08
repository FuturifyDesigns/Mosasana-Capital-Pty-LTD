import type { PostgrestError } from '@supabase/supabase-js'

/** Turn a Supabase/PostgREST error into a user-readable message. */
export function formatSupabaseError(err: unknown): string {
  if (!err || typeof err !== 'object') {
    return 'Something went wrong. Please try again.'
  }

  const e = err as PostgrestError & { status?: number }
  const msg = e.message || ''
  const details = e.details || ''
  const hint = e.hint || ''
  const code = e.code || ''

  if (code === 'PGRST205' || /could not find the table/i.test(msg)) {
    return 'The database is missing a required table. Please ask your administrator to run the latest schema.sql in Supabase.'
  }

  if (/column.*does not exist/i.test(msg) || code === '42703') {
    return 'The database is out of date (missing columns). Please run supabase/fix-live-db.sql in the Supabase SQL editor, then try again.'
  }

  if (/row-level security/i.test(msg) || code === '42501') {
    return 'You do not have permission to do this. Please sign in and try again.'
  }

  if (/active loan/i.test(msg)) {
    return 'You already have an active loan. Please finish repaying it before applying again.'
  }

  if (/duplicate|unique/i.test(msg)) {
    return 'This record already exists. Please use different details or sign in.'
  }

  const parts = [msg, details, hint].filter(Boolean)
  return parts.join(' — ') || 'Something went wrong. Please try again.'
}
