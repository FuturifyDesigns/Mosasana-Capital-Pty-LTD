import { COMPANY, WHATSAPP_NUMBER } from './constants'
import type { LoanRequestFormData } from './validation'

export function buildWhatsAppLoanUrl(data: Partial<LoanRequestFormData>): string {
  const message = [
    `*Loan Application - ${COMPANY.shortName}*`,
    '',
    `Name: ${data.fullName || ''}`,
    `Email: ${data.email || ''}`,
    `Phone: ${data.phone || ''}`,
    `ID Number: ${data.idNumber || ''}`,
    `Address: ${data.physicalAddress || ''}`,
    `Amount: P${data.loanAmount || ''}`,
    `Purpose: ${data.loanPurpose || ''}`,
    `Employment: ${data.employmentStatus || ''}`,
    data.monthlyIncome ? `Monthly Income: P${data.monthlyIncome}` : '',
    '',
    'Please attach a photo of your ID document.',
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
