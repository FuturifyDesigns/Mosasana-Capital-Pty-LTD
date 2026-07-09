export const SITE_URL = 'https://mosasanacapital.com'

// The anon key is public and RLS-protected — load from env (GitHub secret / .env).
export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) || 'https://pwcootcdrbnadsbwduxi.supabase.co'
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

if (import.meta.env.PROD && !SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_ANON_KEY — set it in GitHub Actions secrets or .env')
}
export const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER as string) || '26773467206'

export const COMPANY = {
  name: 'Mosasana Capital (PTY) LTD',
  legalName: 'Mosasana Capital Proprietary Limited',
  shortName: 'Mosasana Capital',
  tagline: 'Short-term relief for daily financial shortfalls',
  meaning:
    'Mosasana is a Setswana word for a temporary structure that relieves and shields people from harsh weather while they make long-term habitat plans.',
  regulator: 'Non Bank Financial Institutions Regulatory Authority (NBFIRA)',
  regulatorShort: 'NBFIRA',
  nbfiraLicense: 'NBFIRA License Number: 11/1/6(243)',
  nbfiraLicenseNumber: '11/1/6(243)',
  companyRegistration: 'BW00006124414',
  licensedYear: '2026',
  location: 'Gaborone',
  serviceArea: 'the breadth and width of Botswana',
  loanTermRange: '1 to 12 months',
  loanAmountMin: 500,
  loanAmountMax: 10000,
  loanAmountRangeLabel: 'P500 to P10,000',
  privacyEffectiveDate: '14 January 2025',
  termsEffectiveDate: '14 January 2025',
  dataProtection: {
    actName: 'Data Protection Act, 2024',
    actReference: 'Data Protection Act, 2024 (Cap. 43:14)',
    actEffectiveDate: '14 January 2025',
    regulator: 'Information and Data Protection Commission',
    regulatorShort: 'IDPC',
    responseDays: 30,
  },
  borrowingCaution:
    'Caution! Borrowing more than you can afford to repay can lead to severe financial difficulties. Terms and conditions apply.',
  vision:
    'To be the trusted provider of short-term financial relief, empowering our clients with stability and confidence in times of need.',
  mission:
    'Our mission is to deliver accessible and reliable short-term financial solutions with integrity, transparency, and care — ensuring our clients find peace of mind and support when it matters most.',
  principalOfficer: {
    name: 'Tshepho Nkile, FCA',
    cell: '73467206',
    email: 'tnkile@mosasanacapital.com',
  },
  complianceOfficer: {
    name: 'Olekantse Ndiweni',
    cell: '77180179',
    email: 'ondiweni@mosasanacapital.com',
  },
  builtBy: {
    name: 'Futurify Designs',
    url: 'https://futurifydesigns.com',
    email: 'futurifydesigns@gmail.com',
  },
} as const

export const LOAN_STATUSES = [
  'pending',
  'reviewing',
  'approved',
  'disbursed',
  'paid',
  'rejected',
  'discontinued',
] as const

/** Shown in the active admin pipeline (Loan Requests tab). */
export const OPEN_LOAN_PIPELINE_STATUSES = ['pending', 'reviewing', 'approved', 'disbursed'] as const

/** Archived — settled or closed; shown under Client Records / archive view. */
export const CLOSED_LOAN_STATUSES = ['paid', 'rejected', 'discontinued'] as const

// Statuses that mean the loan is still open — the client cannot apply for another
// loan while any of their loans are in one of these states.
export const ACTIVE_LOAN_STATUSES = ['pending', 'reviewing', 'approved', 'disbursed'] as const
export type LoanStatus = (typeof LOAN_STATUSES)[number]

export const ENQUIRY_STATUSES = ['new', 'read', 'responded', 'closed'] as const
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number]

/** Default monthly interest (%) suggested in admin UI when no rate is saved yet. 0% is valid when saved. */
export const DEFAULT_MONTHLY_INTEREST_RATE = 10

// Repayment periods clients can choose (in months)
export const LOAN_TERMS = [
  { value: 1, label: '1 month' },
  { value: 2, label: '2 months' },
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 9, label: '9 months' },
  { value: 12, label: '12 months' },
] as const

/** Licensed commercial banks operating in Botswana (for loan disbursement). */
export const BOTSWANA_BANKS = [
  { value: 'absa', label: 'Absa Bank Botswana' },
  { value: 'access', label: 'Access Bank Botswana' },
  { value: 'bancabc', label: 'BancABC Botswana' },
  { value: 'bank-gaborone', label: 'Bank Gaborone' },
  { value: 'bank-of-baroda', label: 'Bank of Baroda (Botswana)' },
  { value: 'bank-of-india', label: 'Bank of India (Botswana)' },
  { value: 'bbs', label: 'Botswana Building Society (BBS)' },
  { value: 'first-capital', label: 'First Capital Bank' },
  { value: 'fnb', label: 'First National Bank Botswana (FNB)' },
  { value: 'stanbic', label: 'Stanbic Bank Botswana' },
  { value: 'standard-chartered', label: 'Standard Chartered Bank Botswana' },
] as const

export type BotswanaBankValue = (typeof BOTSWANA_BANKS)[number]['value']

const bankValueTuple = BOTSWANA_BANKS.map((b) => b.value) as [BotswanaBankValue, ...BotswanaBankValue[]]

export const BOTSWANA_BANK_VALUES = bankValueTuple

export function getBotswanaBankLabel(value: string | null | undefined): string {
  if (!value) return '—'
  return BOTSWANA_BANKS.find((b) => b.value === value)?.label ?? value
}

/** Mobile money wallets used for loan disbursement in Botswana. */
export const MOBILE_WALLET_PROVIDERS = [
  { value: 'orange-money', label: 'Orange Money' },
  { value: 'myzaka', label: 'MyZaka' },
] as const

export type MobileWalletValue = (typeof MOBILE_WALLET_PROVIDERS)[number]['value']

export const MOBILE_WALLET_VALUES = MOBILE_WALLET_PROVIDERS.map((p) => p.value) as [
  MobileWalletValue,
  ...MobileWalletValue[],
]

export type DisbursementKind = 'bank' | 'mobile'

export const DISBURSEMENT_PROVIDERS = [
  ...BOTSWANA_BANKS.map((b) => ({ ...b, kind: 'bank' as DisbursementKind })),
  ...MOBILE_WALLET_PROVIDERS.map((p) => ({ ...p, kind: 'mobile' as DisbursementKind })),
] as const

export type DisbursementProviderValue = (typeof DISBURSEMENT_PROVIDERS)[number]['value']

const disbursementValueTuple = DISBURSEMENT_PROVIDERS.map((p) => p.value) as [
  DisbursementProviderValue,
  ...DisbursementProviderValue[],
]

export const DISBURSEMENT_PROVIDER_VALUES = disbursementValueTuple

export function isMobileWalletProvider(value: string | null | undefined): boolean {
  if (!value) return false
  return MOBILE_WALLET_VALUES.includes(value as MobileWalletValue)
}

export function getDisbursementKind(value: string | null | undefined): DisbursementKind {
  return isMobileWalletProvider(value) ? 'mobile' : 'bank'
}

export function getDisbursementProviderLabel(value: string | null | undefined): string {
  if (!value) return '—'
  const match = DISBURSEMENT_PROVIDERS.find((p) => p.value === value)
  return match?.label ?? value
}

export function getDisbursementTypeLabel(type: string | null | undefined): string {
  if (type === 'mobile') return 'Mobile money'
  if (type === 'bank') return 'Bank account'
  return '—'
}
