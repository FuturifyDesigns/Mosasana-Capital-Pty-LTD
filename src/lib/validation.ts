import { z } from 'zod'
import {
  DISBURSEMENT_PROVIDER_VALUES,
  getDisbursementKind,
  isMobileWalletProvider,
  COMPANY,
} from './constants'
import type { TranslationKey } from './i18n'
import { en as validationEn } from './i18n/validation'
import { formatTranslation } from './i18n/format'

const phoneRegex = /^[0-9]{8}$/
const idNumberRegex = /^[0-9]{9,12}$/
const passportRegex = /^[A-Za-z0-9]{6,15}$/
const LOAN_TERM_MONTHS = [1, 2, 3, 6, 9, 12] as const
const INVALID_ACCOUNT_CHARS = /[-+eE.]/

export type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string

function defaultTranslate(key: TranslationKey, vars?: Record<string, string | number>): string {
  const template = validationEn[key as keyof typeof validationEn]
  if (!template) return String(key)
  return formatTranslation(template, vars)
}

function preprocessRequiredNumber(val: unknown): number | undefined {
  if (val === '' || val === null || val === undefined) return undefined
  const n = typeof val === 'number' ? val : Number(val)
  return Number.isFinite(n) ? n : undefined
}

function preprocessOptionalIncome(val: unknown): number | null | undefined {
  if (val === '' || val === null || val === undefined) return null
  const n = typeof val === 'number' ? val : Number(val)
  if (!Number.isFinite(n)) return undefined
  return n
}

function requiredLoanAmount(t: TranslateFn) {
  return z
    .number({
      required_error: t('validation.amount.required'),
      invalid_type_error: t('validation.amount.invalid'),
    })
    .min(COMPANY.loanAmountMin, t('validation.amount.minLoan', { min: COMPANY.loanAmountMin }))
    .max(COMPANY.loanAmountMax, t('validation.amount.maxLoan', { max: COMPANY.loanAmountMax }))
    .refine((v) => Number.isInteger(v), t('validation.amount.wholeNumber'))
    .refine((v) => v > 0, t('validation.amount.positive'))
}

function requiredTermMonths(t: TranslateFn) {
  return z
    .number({
      required_error: t('validation.term.required'),
      invalid_type_error: t('validation.term.invalid'),
    })
    .int()
    .positive(t('validation.term.invalid'))
    .refine((v) => LOAN_TERM_MONTHS.includes(v as (typeof LOAN_TERM_MONTHS)[number]), {
      message: t('validation.term.invalid'),
    })
}

function optionalMonthlyIncome(t: TranslateFn) {
  return z.union([
    z.null(),
    z
      .number({ invalid_type_error: t('validation.income.invalid') })
      .min(0, t('validation.income.negative'))
      .max(1000000)
      .refine((v) => Number.isInteger(v), t('validation.income.wholeNumber')),
  ])
}

function createDisbursementFieldsSchema(t: TranslateFn) {
  return z.object({
    disbursementProvider: z.enum(DISBURSEMENT_PROVIDER_VALUES, {
      errorMap: () => ({ message: t('validation.disbursement.provider') }),
    }),
    bankAccountHolderName: z
      .string()
      .trim()
      .min(2, t('validation.disbursement.accountName.required'))
      .max(120, t('validation.disbursement.accountName.max'))
      .regex(/^[a-zA-Z\s'.-]+$/, t('validation.disbursement.accountName.invalid')),
    bankAccountNumber: z.string().trim().min(1, t('validation.disbursement.accountNumber.required')),
    bankBranchCode: z.string().trim().optional().or(z.literal('')),
    bankBranchName: z.string().trim().optional().or(z.literal('')),
  })
}

function validateDisbursementFields(
  data: z.infer<ReturnType<typeof createDisbursementFieldsSchema>>,
  ctx: z.RefinementCtx,
  t: TranslateFn,
) {
  const mobile = isMobileWalletProvider(data.disbursementProvider)

  if (INVALID_ACCOUNT_CHARS.test(data.bankAccountNumber)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['bankAccountNumber'],
      message: t('validation.disbursement.noNegative'),
    })
    return
  }

  if (mobile) {
    if (!phoneRegex.test(data.bankAccountNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bankAccountNumber'],
        message: t('validation.disbursement.walletPhone'),
      })
    }
    return
  }

  if (!/^[0-9]{6,20}$/.test(data.bankAccountNumber)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['bankAccountNumber'],
      message: t('validation.disbursement.bankAccount'),
    })
  }
  if (!data.bankBranchCode || !/^[0-9]{3,6}$/.test(data.bankBranchCode)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['bankBranchCode'],
      message: t('validation.disbursement.branchCode'),
    })
  }
  if (!data.bankBranchName || data.bankBranchName.trim().length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['bankBranchName'],
      message: t('validation.disbursement.branchName'),
    })
  }
}

export function createLoginSchema(t: TranslateFn = defaultTranslate) {
  return z.object({
    email: z.string().trim().email(t('validation.email.invalid')).max(255),
    password: z.string().min(8, t('validation.password.min')).max(128, t('validation.password.max')),
  })
}

export function createRegisterSchema(t: TranslateFn = defaultTranslate) {
  return z
    .object({
      fullName: z
        .string()
        .trim()
        .min(2, t('validation.fullName.required'))
        .max(120, t('validation.fullName.max'))
        .regex(/^[a-zA-Z\s'.-]+$/, t('validation.fullName.invalid')),
      email: z.string().trim().email(t('validation.email.invalid')).max(255),
      phone: z.string().trim().regex(phoneRegex, t('validation.phone.invalid')),
      password: z
        .string()
        .min(8, t('validation.password.min'))
        .max(128, t('validation.password.max'))
        .regex(/[A-Z]/, t('validation.password.uppercase'))
        .regex(/[a-z]/, t('validation.password.lowercase'))
        .regex(/[0-9]/, t('validation.password.number')),
      confirmPassword: z.string(),
      acceptTerms: z.boolean().refine((val) => val === true, {
        message: t('validation.terms.required'),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.password.mismatch'),
      path: ['confirmPassword'],
    })
}

export function createForgotPasswordSchema(t: TranslateFn = defaultTranslate) {
  return z.object({
    email: z.string().trim().email(t('validation.email.invalid')).max(255),
  })
}

export function createResetPasswordSchema(t: TranslateFn = defaultTranslate) {
  return z
    .object({
      password: z
        .string()
        .min(8, t('validation.password.min'))
        .max(128, t('validation.password.max'))
        .regex(/[A-Z]/, t('validation.password.uppercase'))
        .regex(/[a-z]/, t('validation.password.lowercase'))
        .regex(/[0-9]/, t('validation.password.number')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.password.mismatch'),
      path: ['confirmPassword'],
    })
}

export function createLoanRequestSchema(t: TranslateFn = defaultTranslate) {
  const disbursementFieldsSchema = createDisbursementFieldsSchema(t)

  return disbursementFieldsSchema
    .merge(
      z.object({
        fullName: z
          .string()
          .trim()
          .min(2, t('validation.fullName.required'))
          .max(120, t('validation.fullName.max'))
          .regex(/^[a-zA-Z\s'.-]+$/, t('validation.fullName.invalid')),
        email: z.string().trim().email(t('validation.email.invalid')).max(255),
        phone: z.string().trim().regex(phoneRegex, t('validation.phone.invalid')),
        idType: z.enum(['national_id', 'passport'], {
          errorMap: () => ({ message: t('validation.idType.required') }),
        }),
        idNumber: z.string().trim().min(5, t('validation.idNumber.required')).max(20),
        physicalAddress: z
          .string()
          .trim()
          .min(10, t('validation.address.min'))
          .max(500, t('validation.address.required')),
        loanAmount: z.preprocess(
          preprocessRequiredNumber,
          requiredLoanAmount(t),
        ) as z.ZodType<number>,
        loanPurpose: z.string().trim().min(5, t('validation.purpose.required')).max(500),
        termMonths: z.preprocess(
          preprocessRequiredNumber,
          requiredTermMonths(t),
        ) as z.ZodType<number>,
        employmentStatus: z.enum(['employed', 'self-employed', 'contract', 'other'], {
          errorMap: () => ({ message: t('validation.employment.required') }),
        }),
        employmentOther: z.string().trim().max(100).optional().or(z.literal('')),
        monthlyIncome: z.preprocess(
          preprocessOptionalIncome,
          optionalMonthlyIncome(t),
        ) as z.ZodType<number | null | undefined>,
        acceptPrivacy: z.boolean().refine((val) => val === true, {
          message: t('validation.privacy.loan'),
        }),
      }),
    )
    .superRefine((data, ctx) => {
      validateDisbursementFields(data, ctx, t)

      if (data.idType === 'national_id' && !idNumberRegex.test(data.idNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['idNumber'],
          message: t('validation.idNumber.nationalId'),
        })
      }
      if (data.idType === 'passport' && !passportRegex.test(data.idNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['idNumber'],
          message: t('validation.idNumber.passport'),
        })
      }
      if (
        data.employmentStatus === 'other' &&
        (!data.employmentOther || data.employmentOther.trim().length < 2)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['employmentOther'],
          message: t('validation.employment.other'),
        })
      }
    })
}

export function createContactSchema(t: TranslateFn = defaultTranslate) {
  return z.object({
    fullName: z
      .string()
      .trim()
      .min(2, t('validation.fullName.required'))
      .max(120, t('validation.fullName.max'))
      .regex(/^[a-zA-Z\s'.-]+$/, t('validation.fullName.invalid')),
    email: z.string().trim().email(t('validation.email.invalid')).max(255),
    phone: z
      .string()
      .trim()
      .regex(phoneRegex, t('validation.phone.invalid'))
      .optional()
      .or(z.literal('')),
    subject: z.string().trim().min(3, t('validation.subject.required')).max(200),
    message: z.string().trim().min(10, t('validation.message.min')).max(2000),
    acceptPrivacy: z.boolean().refine((val) => val === true, {
      message: t('validation.privacy.contact'),
    }),
    companyWebsite: z.string().max(0, t('validation.honeypot')).optional().or(z.literal('')),
  })
}

/** @deprecated Use createLoginSchema(t) with useLanguage().t */
export const loginSchema = createLoginSchema()
/** @deprecated Use createRegisterSchema(t) with useLanguage().t */
export const registerSchema = createRegisterSchema()
/** @deprecated Use createForgotPasswordSchema(t) with useLanguage().t */
export const forgotPasswordSchema = createForgotPasswordSchema()
/** @deprecated Use createResetPasswordSchema(t) with useLanguage().t */
export const resetPasswordSchema = createResetPasswordSchema()
/** @deprecated Use createLoanRequestSchema(t) with useLanguage().t */
export const loanRequestSchema = createLoanRequestSchema()
/** @deprecated Use createContactSchema(t) with useLanguage().t */
export const contactSchema = createContactSchema()

export const ALLOWED_ID_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_ID_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function validateIdFile(file: File, t: TranslateFn = defaultTranslate): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase()
  const allowedByExt = ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp'
  const allowedByType =
    !file.type ||
    ALLOWED_ID_TYPES.includes(file.type as (typeof ALLOWED_ID_TYPES)[number]) ||
    file.type === 'image/jpg'

  if (!allowedByType && !allowedByExt) {
    return t('validation.idFile.type')
  }
  if (file.size > MAX_ID_FILE_SIZE) {
    return t('validation.idFile.size')
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

export function toDisbursementDbFields(data: {
  disbursementProvider: string
  bankAccountHolderName: string
  bankAccountNumber: string
  bankBranchCode?: string
  bankBranchName?: string
}) {
  const mobile = isMobileWalletProvider(data.disbursementProvider)
  return {
    disbursement_type: getDisbursementKind(data.disbursementProvider),
    bank_name: data.disbursementProvider,
    bank_account_name: sanitizeText(data.bankAccountHolderName),
    bank_account_number: sanitizeText(data.bankAccountNumber),
    bank_branch_code: mobile ? null : sanitizeText(data.bankBranchCode || '') || null,
    bank_branch_name: mobile ? null : sanitizeText(data.bankBranchName || '') || null,
  }
}

export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[<>]/g, '')
}

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>
export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>
export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>
export type ResetPasswordFormData = z.infer<ReturnType<typeof createResetPasswordSchema>>
export type LoanRequestFormData = z.infer<ReturnType<typeof createLoanRequestSchema>>
export type ContactFormData = z.infer<ReturnType<typeof createContactSchema>>
