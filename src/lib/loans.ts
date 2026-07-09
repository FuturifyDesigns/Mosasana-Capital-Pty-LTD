import type { LoanRequest } from './supabase'
import { ACTIVE_LOAN_STATUSES, DEFAULT_MONTHLY_INTEREST_RATE } from './constants'
import { formatPula, toNumber } from './format'

const DAY_MS = 24 * 60 * 60 * 1000

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

/**
 * Stored rate on the loan, or a UI suggestion when admin has not saved terms yet.
 * Explicit 0% is preserved — never treated as “use default”.
 */
export function resolveInterestRate(
  stored: number | null | undefined,
  suggestionIfUnset: number = DEFAULT_MONTHLY_INTEREST_RATE,
): number {
  if (stored !== null && stored !== undefined && Number.isFinite(stored)) {
    return Math.max(0, stored)
  }
  return suggestionIfUnset
}

/** Parse interest % from input; returns null when empty/invalid. 0 is valid. */
export function parseInterestRateInput(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 0 || n > 100) return null
  return n
}

/** Statuses where repayments can be tracked and payments recorded. */
export const REPAYABLE_LOAN_STATUSES = ['disbursed'] as const

export function canRecordPayments(loan: LoanRequest): boolean {
  return (REPAYABLE_LOAN_STATUSES as unknown as string[]).includes(loan.status)
}

/**
 * Simple interest: principal + (principal × monthly rate × term months).
 * monthlyRatePercent of 0 means no interest — total equals principal.
 */
export function calculateTotalRepayable(
  principal: number,
  termMonths: number,
  monthlyRatePercent: number = DEFAULT_MONTHLY_INTEREST_RATE,
): number {
  const p = toNumber(principal)
  const term = Math.max(termMonths, 1)
  const rate = Math.max(0, monthlyRatePercent) / 100
  const interest = p * rate * term
  return Math.round((p + interest) * 100) / 100
}

export function calculateInterestAmount(
  principal: number,
  termMonths: number,
  monthlyRatePercent: number = DEFAULT_MONTHLY_INTEREST_RATE,
): number {
  const total = calculateTotalRepayable(principal, termMonths, monthlyRatePercent)
  return Math.round((total - toNumber(principal)) * 100) / 100
}

export function getDueDate(loan: LoanRequest): Date | null {
  if (loan.due_date) return new Date(loan.due_date)
  if (loan.term_months) return addMonths(new Date(loan.created_at), loan.term_months)
  return null
}

export function isActiveLoan(loan: LoanRequest): boolean {
  return (ACTIVE_LOAN_STATUSES as unknown as string[]).includes(loan.status)
}

export function getOutstandingBalance(loan: LoanRequest): number | null {
  const total = loan.total_repayable != null ? toNumber(loan.total_repayable) : null
  if (total == null) return null
  return Math.max(total - toNumber(loan.amount_paid), 0)
}

export function getInterestAndFeesAmount(loan: LoanRequest): number | null {
  if (loan.total_repayable == null) return null
  return Math.max(toNumber(loan.total_repayable) - toNumber(loan.loan_amount), 0)
}

export function getMinimumRepayableTotal(loan: LoanRequest): number {
  return Math.max(toNumber(loan.loan_amount), toNumber(loan.amount_paid))
}

export function getEstimatedTotalRepayable(loan: LoanRequest): number {
  const rate = resolveInterestRate(loan.interest_rate)
  return calculateTotalRepayable(toNumber(loan.loan_amount), loan.term_months ?? 1, rate)
}

export function formatDueDate(date: Date | string | null): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export type ReminderLevel = 'ok' | 'soon' | 'due' | 'overdue'

export interface Reminder {
  level: ReminderLevel
  daysLeft: number
  dueDate: Date
  message: string
}

export function getRepaymentReminder(loan: LoanRequest): Reminder | null {
  if (!isActiveLoan(loan)) return null
  const dueDate = getDueDate(loan)
  if (!dueDate) return null

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDue = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
  const daysLeft = Math.round((startOfDue.getTime() - startOfToday.getTime()) / DAY_MS)

  const balance = getOutstandingBalance(loan)
  const amount =
    balance != null ? formatPula(balance) : `your ${loan.term_months ?? ''}-month loan`

  let level: ReminderLevel
  let message: string
  if (daysLeft < 0) {
    level = 'overdue'
    message = `Your repayment of ${amount} is overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'}. Please pay as soon as possible to avoid extra charges.`
  } else if (daysLeft === 0) {
    level = 'due'
    message = `Your repayment of ${amount} is due today.`
  } else if (daysLeft <= 7) {
    level = 'soon'
    message = `Reminder: your repayment of ${amount} is due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`
  } else {
    level = 'ok'
    message = `Your next repayment of ${amount} is due in ${daysLeft} days.`
  }

  return { level, daysLeft, dueDate, message }
}
