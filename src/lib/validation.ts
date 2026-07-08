import { z } from 'zod'
import { COMPANY } from './constants'

const phoneRegex = /^[0-9]{8}$/
const idNumberRegex = /^[0-9]{9,12}$/
const passportRegex = /^[A-Za-z0-9]{6,15}$/

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
})

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name is required')
      .max(120, 'Name is too long')
      .regex(/^[a-zA-Z\s'.-]+$/, 'Name contains invalid characters'),
    email: z.string().trim().email('Enter a valid email address').max(255),
    phone: z
      .string()
      .trim()
      .regex(phoneRegex, 'Enter a valid 8-digit Botswana mobile number'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[a-z]/, 'Include at least one lowercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Terms and Conditions and Privacy Policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(255),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[a-z]/, 'Include at least one lowercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const loanRequestSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name is required')
      .max(120)
      .regex(/^[a-zA-Z\s'.-]+$/, 'Name contains invalid characters'),
    email: z.string().trim().email('Enter a valid email').max(255),
    phone: z.string().trim().regex(phoneRegex, 'Enter a valid 8-digit Botswana mobile number'),
    idType: z.enum(['national_id', 'passport'], {
      errorMap: () => ({ message: 'Select your document type' }),
    }),
    idNumber: z.string().trim().min(5, 'Enter your document number').max(20),
    physicalAddress: z.string().trim().min(10, 'Enter your full physical address').max(500),
    loanAmount: z
      .number({ invalid_type_error: 'Enter a valid amount' })
      .min(500, 'Minimum loan amount is P500')
      .max(COMPANY.loanAmountMax, `Maximum loan amount is P${COMPANY.loanAmountMax.toLocaleString()}`)
      .refine((v) => Number.isInteger(v), 'Enter a whole number (no decimals)'),
    loanPurpose: z.string().trim().min(5, 'Describe the purpose of the loan').max(500),
    termMonths: z
      .number({ invalid_type_error: 'Select a repayment period' })
      .int()
      .refine((v) => [1, 2, 3, 6, 9, 12].includes(v), 'Select a repayment period'),
    employmentStatus: z.enum(['employed', 'self-employed', 'contract', 'other'], {
      errorMap: () => ({ message: 'Select your employment status' }),
    }),
    employmentOther: z.string().trim().max(100).optional().or(z.literal('')),
    monthlyIncome: z
      .number({ invalid_type_error: 'Enter a valid income' })
      .min(0)
      .max(1000000)
      .optional()
      .nullable(),
    acceptPrivacy: z.boolean().refine((val) => val === true, {
      message: 'You must consent to our Privacy Policy to submit a loan application',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.idType === 'national_id' && !idNumberRegex.test(data.idNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['idNumber'],
        message: 'Enter a valid Omang / National ID (9–12 digits)',
      })
    }
    if (data.idType === 'passport' && !passportRegex.test(data.idNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['idNumber'],
        message: 'Enter a valid passport number (6–15 letters/digits)',
      })
    }
    if (data.employmentStatus === 'other' && (!data.employmentOther || data.employmentOther.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['employmentOther'],
        message: 'Please describe your employment',
      })
    }
  })

export const contactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name is required')
    .max(120)
    .regex(/^[a-zA-Z\s'.-]+$/, 'Name contains invalid characters'),
  email: z.string().trim().email('Enter a valid email').max(255),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Enter a valid 8-digit Botswana mobile number')
    .optional()
    .or(z.literal('')),
  subject: z.string().trim().min(3, 'Subject is required').max(200),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000),
  acceptPrivacy: z.boolean().refine((val) => val === true, {
    message: 'You must consent to our Privacy Policy to send an enquiry',
  }),
})

export const ALLOWED_ID_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_ID_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function validateIdFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase()
  const allowedByExt = ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp'
  const allowedByType =
    !file.type ||
    ALLOWED_ID_TYPES.includes(file.type as (typeof ALLOWED_ID_TYPES)[number]) ||
    file.type === 'image/jpg'

  if (!allowedByType && !allowedByExt) {
    return 'ID photo must be JPEG, PNG, or WebP'
  }
  if (file.size > MAX_ID_FILE_SIZE) {
    return 'ID photo must be under 5MB'
  }
  return null
}

/** Guess a safe image MIME type when the browser leaves file.type empty. */
export function imageContentType(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  return 'image/jpeg'
}

export function sanitizeText(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type LoanRequestFormData = z.infer<typeof loanRequestSchema>
export type ContactFormData = z.infer<typeof contactSchema>
