import { z } from 'zod'

const phoneRegex = /^(\+?267)?[0-9]{8}$/
const idNumberRegex = /^[0-9]{9,12}$/

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
      .regex(phoneRegex, 'Enter a valid Botswana phone number (8 digits)'),
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

export const loanRequestSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name is required')
    .max(120)
    .regex(/^[a-zA-Z\s'.-]+$/, 'Name contains invalid characters'),
  email: z.string().trim().email('Enter a valid email').max(255),
  phone: z.string().trim().regex(phoneRegex, 'Enter a valid Botswana phone number'),
  idNumber: z
    .string()
    .trim()
    .regex(idNumberRegex, 'Enter a valid ID number (9–12 digits)'),
  physicalAddress: z.string().trim().min(10, 'Enter your full physical address').max(500),
  loanAmount: z
    .number({ invalid_type_error: 'Enter a valid amount' })
    .min(500, 'Minimum loan amount is P500')
    .max(50000, 'Maximum loan amount is P50,000'),
  loanPurpose: z.string().trim().min(5, 'Describe the purpose of the loan').max(500),
  employmentStatus: z.enum(['employed', 'self-employed', 'contract', 'other'], {
    errorMap: () => ({ message: 'Select your employment status' }),
  }),
  monthlyIncome: z
    .number({ invalid_type_error: 'Enter a valid income' })
    .min(0)
    .max(1000000)
    .optional()
    .nullable(),
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
    .regex(phoneRegex, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  subject: z.string().trim().min(3, 'Subject is required').max(200),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000),
})

export const ALLOWED_ID_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_ID_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function validateIdFile(file: File): string | null {
  if (!ALLOWED_ID_TYPES.includes(file.type as (typeof ALLOWED_ID_TYPES)[number])) {
    return 'ID photo must be JPEG, PNG, or WebP'
  }
  if (file.size > MAX_ID_FILE_SIZE) {
    return 'ID photo must be under 5MB'
  }
  return null
}

export function sanitizeText(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type LoanRequestFormData = z.infer<typeof loanRequestSchema>
export type ContactFormData = z.infer<typeof contactSchema>
