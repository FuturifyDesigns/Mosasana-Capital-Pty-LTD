export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string
export const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER as string) || '26773467206'

export const COMPANY = {
  name: 'Mosasana Capital (PTY) LTD',
  shortName: 'Mosasana Capital',
  tagline: 'Trusted short-term financial relief',
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
    cell: '+267 77180179',
    email: 'ondiweni@mosasanacapital.com',
  },
  builtBy: {
    name: 'Futurify Designs',
    url: 'https://futurifydesigns.com',
    email: 'futurifydesigns@gmail.com',
  },
} as const

export const LOAN_STATUSES = ['pending', 'reviewing', 'approved', 'rejected', 'disbursed'] as const
export type LoanStatus = (typeof LOAN_STATUSES)[number]

export const ENQUIRY_STATUSES = ['new', 'read', 'responded', 'closed'] as const
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number]
