import { supabase } from '@/lib/supabase'
import { normalizeBotswanaPhone } from '@/lib/phone'

export type IdType = 'national_id' | 'passport'

export interface IdentityCheckInput {
  email?: string
  phone?: string
  idNumber?: string
  idType?: IdType
  excludeUserId?: string
}

export interface IdentityCheckResult {
  emailTaken: boolean
  phoneTaken: boolean
  idNumberTaken: boolean
}

export function normalizeIdNumber(idNumber: string, idType: IdType): string {
  const trimmed = idNumber.trim()
  if (idType === 'passport') return trimmed.replace(/\s/g, '').toUpperCase()
  return trimmed.replace(/\D/g, '')
}

export async function checkEmailTaken(
  email: string,
  excludeUserId?: string,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return false

  const { data, error } = await supabase.rpc('email_taken', {
    p_email: normalized,
    p_exclude_user_id: excludeUserId ?? null,
  })

  if (error) {
    console.error('email_taken RPC failed:', error.message)
    return false
  }

  return Boolean(data)
}

export async function checkPhoneTaken(
  phone: string,
  excludeUserId?: string,
): Promise<boolean> {
  const normalized = normalizeBotswanaPhone(phone)
  if (normalized.length !== 8) return false

  const { data, error } = await supabase.rpc('phone_taken', {
    p_phone: normalized,
    p_exclude_user_id: excludeUserId ?? null,
  })

  if (error) {
    console.error('phone_taken RPC failed:', error.message)
    return false
  }

  return Boolean(data)
}

export async function checkIdNumberTaken(
  idNumber: string,
  idType: IdType,
  excludeUserId?: string,
): Promise<boolean> {
  const normalized = normalizeIdNumber(idNumber, idType)
  if (normalized.length < 5) return false

  const { data, error } = await supabase.rpc('id_number_taken', {
    p_id_number: normalized,
    p_id_type: idType,
    p_exclude_user_id: excludeUserId ?? null,
  })

  if (error) {
    console.error('id_number_taken RPC failed:', error.message)
    return false
  }

  return Boolean(data)
}

export async function checkIdentityAvailability(
  input: IdentityCheckInput,
): Promise<IdentityCheckResult> {
  const [emailTaken, phoneTaken, idNumberTaken] = await Promise.all([
    input.email ? checkEmailTaken(input.email, input.excludeUserId) : Promise.resolve(false),
    input.phone ? checkPhoneTaken(input.phone, input.excludeUserId) : Promise.resolve(false),
    input.idNumber && input.idType
      ? checkIdNumberTaken(input.idNumber, input.idType, input.excludeUserId)
      : Promise.resolve(false),
  ])

  return { emailTaken, phoneTaken, idNumberTaken }
}
