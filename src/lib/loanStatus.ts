import type { TranslationKey } from '@/lib/i18n'
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
    adminHint: 'Waiting for your decision.',
    clientTitle: 'Under review',
    clientMessage:
      'Our team is reviewing your application. We may contact you if we need any additional information.',
    tone: 'blue',
  },
  reviewing: {
    label: 'In review',
    adminHint: 'Waiting for your decision.',
    clientTitle: 'Under review',
    clientMessage:
      'Our team is reviewing your application. We may contact you if we need any additional information.',
    tone: 'blue',
  },
  approved: {
    label: 'Approved',
    adminHint: 'Set repayment terms, send funds, then mark Disbursed.',
    clientTitle: 'Application approved',
    clientMessage:
      'Your loan has been approved. Repayment terms will be confirmed before or when funds are disbursed.',
    tone: 'green',
  },
  disbursed: {
    label: 'Disbursed',
    adminHint: 'Record repayments until the loan is fully paid.',
    clientTitle: 'Loan disbursed',
    clientMessage:
      'Your loan has been disbursed. Make repayments as agreed; your balance updates here when payments are recorded.',
    tone: 'brand',
  },
  paid: {
    label: 'Paid',
    adminHint: 'Loan fully repaid — no further action needed.',
    clientTitle: 'Loan fully repaid',
    clientMessage:
      'Congratulations! This loan is fully repaid. You may apply for a new loan when you are ready.',
    tone: 'emerald',
  },
  rejected: {
    label: 'Rejected',
    adminHint: 'Application declined — no further action needed.',
    clientTitle: 'Application not approved',
    clientMessage:
      'Unfortunately this application was not approved. Contact us if you have questions or would like to discuss options.',
    tone: 'red',
  },
  discontinued: {
    label: 'Discontinued',
    adminHint: 'Request closed — client was notified.',
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
  disbursed: ['disbursed'],
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

export function hasSavedRepaymentTerms(loan: LoanRequest): boolean {
  return (
    loan.total_repayable != null &&
    loan.total_repayable > 0 &&
    loan.due_date != null &&
    loan.due_date.trim() !== '' &&
    loan.interest_rate !== null &&
    loan.interest_rate !== undefined
  )
}

export type AdminWorkflowStepId = 'decision' | 'terms' | 'disburse' | 'repay'

export interface AdminWorkflowStep {
  id: AdminWorkflowStepId
  label: string
  description: string
}

export const ADMIN_WORKFLOW_STEPS: readonly AdminWorkflowStep[] = [
  { id: 'decision', label: 'Decide', description: 'Approve or reject the application' },
  { id: 'terms', label: 'Set terms', description: 'Save interest, total & due date' },
  { id: 'disburse', label: 'Disburse', description: 'Send funds, then mark Disbursed' },
  { id: 'repay', label: 'Collect', description: 'Record repayments until fully paid' },
] as const

export const ADMIN_WORKFLOW_STEP_KEYS: Record<
  AdminWorkflowStepId,
  { labelKey: TranslationKey; descKey: TranslationKey }
> = {
  decision: { labelKey: 'admin.workflow.decide', descKey: 'admin.workflow.decide.desc' },
  terms: { labelKey: 'admin.workflow.setTerms', descKey: 'admin.workflow.setTerms.desc' },
  disburse: { labelKey: 'admin.workflow.disburse', descKey: 'admin.workflow.disburse.desc' },
  repay: { labelKey: 'admin.workflow.collect', descKey: 'admin.workflow.collect.desc' },
}

export function getActiveWorkflowStepId(loan: LoanRequest): AdminWorkflowStepId | 'closed' {
  if (isClosedLoanStatus(loan.status)) return 'closed'
  if (isInReviewLoanStatus(loan.status)) return 'decision'
  if (loan.status === 'approved' && !hasSavedRepaymentTerms(loan)) return 'terms'
  if (loan.status === 'approved') return 'disburse'
  if (loan.status === 'disbursed') return 'repay'
  return 'closed'
}

export function getWorkflowStepState(
  loan: LoanRequest,
  stepId: AdminWorkflowStepId,
): 'complete' | 'current' | 'locked' {
  const active = getActiveWorkflowStepId(loan)
  if (active === 'closed') return 'complete'

  const order = ADMIN_WORKFLOW_STEPS.map((s) => s.id)
  const activeIndex = order.indexOf(active)
  const stepIndex = order.indexOf(stepId)

  if (stepIndex < activeIndex) return 'complete'
  if (stepIndex === activeIndex) return 'current'
  return 'locked'
}

export function canMarkDisbursed(loan: LoanRequest): boolean {
  return loan.status === 'approved' && hasSavedRepaymentTerms(loan)
}

export function isInReviewLoanStatus(status: string): boolean {
  return status === 'reviewing' || status === 'pending'
}

export function formatLoanStatusLabel(status: string): string {
  if (isInReviewLoanStatus(status)) return LOAN_STATUS_META.reviewing.label
  const meta = LOAN_STATUS_META[status as LoanStatus]
  return meta?.label ?? status.charAt(0).toUpperCase() + status.slice(1)
}

export function getLoanStatusLabelKey(status: string): TranslationKey {
  if (isInReviewLoanStatus(status)) return 'status.reviewing'
  return `status.${status}` as TranslationKey
}

export function getAdminStatusPanelTitleKey(loan: LoanRequest): TranslationKey {
  if (loan.status === 'disbursed') return 'admin.statusPanel.loanActive'
  if (isLoanLocked(loan)) return 'admin.statusPanel.closed'
  return 'admin.statusPanel.updateStatus'
}

export function getAdminNextStepHintKey(loan: LoanRequest): TranslationKey {
  const status = loan.status as LoanStatus

  if (isInReviewLoanStatus(status)) return 'admin.nextStep.review'

  if (status === 'approved') {
    if (!hasSavedRepaymentTerms(loan)) return 'admin.nextStep.termsRequired'
    return 'admin.nextStep.disburse'
  }

  if (status === 'disbursed') return 'admin.nextStep.repay'
  if (status === 'paid') return 'admin.nextStep.paid'
  if (status === 'rejected') return 'admin.nextStep.rejected'
  if (status === 'discontinued') return 'admin.nextStep.discontinued'

  return `admin.statusHint.${status}` as TranslationKey
}

export function getAdminStatusOptions(
  loan: LoanRequest,
): { value: string; labelKey: TranslationKey }[] {
  const current = loan.status as LoanStatus
  if (!LOAN_STATUSES.includes(current)) {
    return LOAN_STATUSES.map((s) => ({ value: s, labelKey: getLoanStatusLabelKey(s) }))
  }

  if (isLoanLocked(loan)) {
    return [{ value: current, labelKey: getLoanStatusLabelKey(current) }]
  }

  if (isInReviewLoanStatus(current)) {
    return [
      { value: current, labelKey: 'status.reviewing' },
      { value: 'approved', labelKey: 'admin.statusOption.approvedAccept' },
      { value: 'rejected', labelKey: 'admin.statusOption.rejectedDecline' },
    ]
  }

  if (current === 'approved') {
    const options: { value: string; labelKey: TranslationKey }[] = [
      { value: 'approved', labelKey: 'status.approved' },
      { value: 'rejected', labelKey: 'admin.statusOption.rejectedCancel' },
    ]
    if (canMarkDisbursed(loan)) {
      options.splice(1, 0, { value: 'disbursed', labelKey: 'admin.statusOption.disbursedSent' })
    }
    return options
  }

  const allowed = TRANSITIONS[current]
  return allowed.map((s) => ({ value: s, labelKey: getLoanStatusLabelKey(s) }))
}

export function canAdminChangeStatus(loan: LoanRequest): boolean {
  if (loan.status === 'disbursed') return false
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

  if (nextStatus === 'disbursed') {
    if (!hasSavedRepaymentTerms(loan)) {
      return 'Save repayment terms (interest, total repayable, and due date) before marking as disbursed.'
    }
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
