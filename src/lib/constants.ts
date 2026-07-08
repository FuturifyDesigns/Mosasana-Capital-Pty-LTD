export const SITE_URL = 'https://mosasanacapital.com'

// The anon key is a public, RLS-protected key and is safe to ship in the client
// bundle. Fallback defaults ensure the app never white-screens if a build-time
// environment variable is missing (e.g. a GitHub Actions secret is not set).
export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) || 'https://pwcootcdrbnadsbwduxi.supabase.co'
export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3Y29vdGNkcmJuYWRzYndkdXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MjY5MDAsImV4cCI6MjA5OTAwMjkwMH0.wT1W3gC5Pfktjb875Rn2gxQWO_jahzdMZkP-GdHf5xw'
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
] as const

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
