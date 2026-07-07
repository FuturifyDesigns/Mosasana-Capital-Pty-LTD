import { createClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './constants'

export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  physical_address: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface LoanRequest {
  id: string
  user_id: string | null
  full_name: string
  email: string
  phone: string
  id_number: string
  id_photo_path: string | null
  physical_address: string
  loan_amount: number
  loan_purpose: string
  employment_status: string
  monthly_income: number | null
  status: string
  admin_notes: string | null
  source: 'website' | 'whatsapp'
  created_at: string
  updated_at: string
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
  },
})
