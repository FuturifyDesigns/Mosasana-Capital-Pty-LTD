import { createClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './constants'

export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  physical_address: string | null
  bank_name: string | null
  disbursement_type: 'bank' | 'mobile' | null
  bank_account_name: string | null
  bank_account_number: string | null
  bank_branch_code: string | null
  bank_branch_name: string | null
  role: UserRole
  banned: boolean
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id: string
  full_name: string
  phone: string | null
  bank_name: string | null
  disbursement_type: 'bank' | 'mobile' | null
  bank_account_name: string | null
  bank_account_number: string | null
  bank_branch_code: string | null
  bank_branch_name: string | null
  role: UserRole
  banned: boolean
  created_at: string
  email: string
  loan_count: number
  active_loan_count: number
}

export interface LoanRequest {
  id: string
  user_id: string | null
  full_name: string
  email: string
  phone: string
  id_number: string
  id_type: string | null
  id_photo_path: string | null
  physical_address: string
  loan_amount: number
  loan_purpose: string
  term_months: number | null
  employment_status: string
  monthly_income: number | null
  status: string
  interest_rate: number | null
  total_repayable: number | null
  amount_paid: number | null
  due_date: string | null
  admin_notes: string | null
  source: 'website' | 'whatsapp'
  created_at: string
  updated_at: string
}

export interface LoanPayment {
  id: string
  loan_id: string
  amount: number
  notes: string | null
  recorded_by: string | null
  interest_rate_snapshot: number | null
  total_repayable_snapshot: number | null
  created_at: string
}

export interface AppNotification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  loan_id: string | null
  read_at: string | null
  created_at: string
}

export interface ContactEnquiry {
  id: string
  full_name: string
  email: string
  phone: string | null
  subject: string
  message: string
  status: string
  created_at: string
  updated_at: string
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
