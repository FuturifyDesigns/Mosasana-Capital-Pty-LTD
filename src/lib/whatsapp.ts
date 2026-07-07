import { COMPANY, WHATSAPP_NUMBER } from './constants'
import type { LoanRequestFormData } from './validation'

export function buildWhatsAppLoanUrl(data: Partial<LoanRequestFormData>): string {
  const docLabel = data.idType === 'passport' ? 'Passport Number' : 'Omang / ID Number'
  const employment =
    data.employmentStatus === 'other' && data.employmentOther
      ? data.employmentOther
      : data.employmentStatus || ''
  const message = [
    `*Loan Application - ${COMPANY.shortName}*`,
    '',
    `Name: ${data.fullName || ''}`,
    `Email: ${data.email || ''}`,
    `Phone: ${data.phone || ''}`,
    `${docLabel}: ${data.idNumber || ''}`,
    `Address: ${data.physicalAddress || ''}`,
    `Amount: P${data.loanAmount || ''}`,
    data.termMonths ? `Repayment period: ${data.termMonths} month(s)` : '',
    `Purpose: ${data.loanPurpose || ''}`,
    `Employment: ${employment}`,
    data.monthlyIncome ? `Monthly Income: P${data.monthlyIncome}` : '',
    '',
    'Please attach a photo of your ID / passport document.',
  ]
    .filter(Boolean)
    .join('\n')

  return `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}

export function buildWhatsAppContactUrl(name: string, message: string): string {
  const text = `*Enquiry from ${name}*\n\n${message}`
  return `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}

export function buildWhatsAppGeneralUrl(): string {
  const text = `Hello ${COMPANY.shortName}, I would like to enquire about your cash loan services.`
  return `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}
