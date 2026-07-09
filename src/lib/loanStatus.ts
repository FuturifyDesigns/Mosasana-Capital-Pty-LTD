import type { LoanRequest } from './supabase'
import { LOAN_STATUSES } from './constants'
import { getOutstandingBalance } from './loans'

export type LoanStatus = (typeof LOAN_STATUSES)[number]

export interface LoanStatusMeta {
  label: string
  adminHint: string
  clientTitle: string
  clientMessage: string
  tone: 'yellow' | 'blue' | 'green' | 'red' | 'brand' | 'emerald'
}

export const LOAN_STATUS_META: Record<LoanStatus, LoanStatusMeta> = {
  pending: {
    label: 'In review',
    adminHint: 'Approve or reject this application.',
    clientTitle: 'Under review',
    clientMessage:
      'Our team is reviewing your application. We may contact you if we need any additional information.',
    tone: 'blue',
  },
  reviewing: {
    label: 'In review',
    adminHint: 'Approve or reject this application.',
    clientTitle: 'Under review',
    clientMessage:
      'Our team is reviewing your application. We may contact you if we need any additional information.',
    tone: 'blue',
  },
  approved: {
    label: 'Approved',
    adminHint: 'Approved — set repayment terms, then mark Disbursed when funds are sent.',
    clientTitle: 'Application approved',
    clientMessage:
      'Your loan has been approved. Repayment terms will be confirmed before or when funds are disbursed.',
    tone: 'green',
  },
  disbursed: {
    label: 'Disbursed',
    adminHint: 'Funds sent — record payments as received. Status becomes Paid automatically when fully repaid.',
    clientTitle: 'Loan disbursed',
    clientMessage:
      'Your loan has been disbursed. Make repayments as agreed; your balance updates here when payments are recorded.',
    tone: 'brand',
  },
  paid: {
    label: 'Paid',
    adminHint: 'Fully repaid — this record is locked and cannot be edited.',
    clientTitle: 'Loan fully repaid',
    clientMessage:
      'Congratulations! This loan is fully repaid. You may apply for a new loan when you are ready.',
    tone: 'emerald',
  },
  rejected: {
    label: 'Rejected',
    adminHint: 'Application declined — record is locked.',
    clientTitle: 'Application not approved',
    clientMessage:
      'Unfortunately this application was not approved. Contact us if you have questions or would like to discuss options.',
    tone: 'red',
  },
  discontinued: {
    label: 'Discontinued',
    adminHint: 'Request discontinued — record is locked. Client was notified.',
    clientTitle: 'Request discontinued',
    clientMessage:
      'This loan request was discontinued. You may submit a new application when you are ready, or contact us if you have questions.',
    tone: 'red',
  },
}

const TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
  pending: ['pending', 'approved', 'rejected'],
  reviewing: ['reviewing', 'approved', 'rejected'],
  approved: ['approved', 'disbursed', 'rejected'],
  disbursed: ['disbursed', 'rejected'],
  paid: ['paid'],
  rejected: ['rejected'],
  discontinued: ['discontinued'],
}

export function isClosedLoanStatus(status: string): boolean {
  return status === 'paid' || status === 'rejected' || status === 'discontinued'
}

export function isLoanLocked(loan: LoanRequest): boolean {
  return isClosedLoanStatus(loan.status)
}

export function isInReviewLoanStatus(status: string): boolean {
  return status === 'reviewing' || status === 'pending'
}

export function formatLoanStatusLabel(status: string): string {
  if (isInReviewLoanStatus(status)) return LOAN_STATUS_META.reviewing.label
  const meta = LOAN_STATUS_META[status as LoanStatus]
  return meta?.label ?? status.charAt(0).toUpperCase() + status.slice(1)
}

export function getAdminStatusOptions(loan: LoanRequest): { value: string; label: string }[] {
  const current = loan.status as LoanStatus
  if (!LOAN_STATUSES.includes(current)) {
    return LOAN_STATUSES.map((s) => ({ value: s, label: formatLoanStatusLabel(s) }))
  }

  if (isLoanLocked(loan)) {
    return [{ value: current, label: formatLoanStatusLabel(current) }]
  }

  if (isInReviewLoanStatus(current)) {
    return [
      { value: current, label: LOAN_STATUS_META.reviewing.label },
      { value: 'approved', label: LOAN_STATUS_META.approved.label },
      { value: 'rejected', label: LOAN_STATUS_META.rejected.label },
    ]
  }

  const allowed = TRANSITIONS[current]
  return allowed.map((s) => ({ value: s, label: LOAN_STATUS_META[s].label }))
}

export function canAdminChangeStatus(loan: LoanRequest): boolean {
  return !isLoanLocked(loan)
}

export function validateStatusChange(loan: LoanRequest, nextStatus: string): string | null {
  const current = loan.status as LoanStatus
  if (current === nextStatus) return null

  if (isLoanLocked(loan)) {
    return 'Closed loan requests cannot be changed.'
  }

  if (nextStatus === 'paid') {
    const balance = getOutstandingBalance(loan)
    if (balance == null || balance > 0) {
      return 'Status becomes Paid automatically when the full amount has been recorded.'
    }
  }

  const allowed = TRANSITIONS[current] ?? LOAN_STATUSES
  if (!(allowed as string[]).includes(nextStatus)) {
    return `Cannot move from ${LOAN_STATUS_META[current].label} to ${nextStatus}.`
  }

  if (nextStatus === 'disbursed' && loan.total_repayable == null) {
    return 'Set repayment terms before marking as disbursed.'
  }

  return null
}

export function statusBadgeClass(status: string): string {
  if (isInReviewLoanStatus(status)) return 'bg-blue-100 text-blue-800'
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    reviewing: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    discontinued: 'bg-orange-100 text-orange-800',
    disbursed: 'bg-brand-100 text-brand-800',
    paid: 'bg-emerald-100 text-emerald-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-800'
}

export function clientStatusBannerClass(tone: LoanStatusMeta['tone']): string {
  const map = {
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    green: 'border-green-200 bg-green-50 text-green-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    brand: 'border-brand-200 bg-brand-50 text-brand-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  }
  return map[tone]
}
