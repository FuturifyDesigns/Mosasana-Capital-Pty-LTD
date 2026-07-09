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

export interface LoanApplicationIdentityInput extends IdentityCheckInput {
  userId: string
  accountEmail?: string | null
  accountPhone?: string | null
}

/** Logged-in applicants may reuse their own account email, phone, and prior ID numbers. */
export async function checkIdentityForLoanApplication(
  input: LoanApplicationIdentityInput,
): Promise<IdentityCheckResult> {
  const accountEmail = input.accountEmail?.trim().toLowerCase() ?? ''
  const submittedEmail = input.email?.trim().toLowerCase() ?? ''
  const accountPhone = input.accountPhone ? normalizeBotswanaPhone(input.accountPhone) : ''
  const submittedPhone = input.phone ? normalizeBotswanaPhone(input.phone) : ''

  const skipEmail = Boolean(accountEmail && submittedEmail && submittedEmail === accountEmail)
  const skipPhone = Boolean(
    accountPhone && submittedPhone && submittedPhone === accountPhone && submittedPhone.length === 8,
  )

  let skipId = false
  if (input.idNumber && input.idType && input.userId) {
    const normalized = normalizeIdNumber(input.idNumber, input.idType)
    const { data, error } = await supabase
      .from('loan_requests')
      .select('id_number, id_type')
      .eq('user_id', input.userId)

    if (error) {
      console.error('Failed to load prior loan identities:', error.message)
    } else {
      skipId = (data ?? []).some((row) => {
        if (!row.id_number) return false
        const type = (row.id_type as IdType) || 'national_id'
        return normalizeIdNumber(row.id_number, type) === normalized
      })
    }
  }

  return checkIdentityAvailability({
    email: skipEmail ? undefined : input.email,
    phone: skipPhone ? undefined : input.phone,
    idNumber: skipId ? undefined : input.idNumber,
    idType: input.idType,
    excludeUserId: input.userId,
  })
}
