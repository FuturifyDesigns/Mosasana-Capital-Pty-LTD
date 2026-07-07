import type { LoanRequest } from './supabase'
import { ACTIVE_LOAN_STATUSES } from './constants'

const DAY_MS = 24 * 60 * 60 * 1000

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

/**
 * Best-effort due date for a loan.
 * Uses the admin-set due_date if present, otherwise estimates it from the
 * repayment term counted from when the application was created.
 */
export function getDueDate(loan: LoanRequest): Date | null {
  if (loan.due_date) return new Date(loan.due_date)
  if (loan.term_months) return addMonths(new Date(loan.created_at), loan.term_months)
  return null
}

export function isActiveLoan(loan: LoanRequest): boolean {
  return (ACTIVE_LOAN_STATUSES as unknown as string[]).includes(loan.status)
}

export type ReminderLevel = 'ok' | 'soon' | 'due' | 'overdue'

export interface Reminder {
  level: ReminderLevel
  daysLeft: number
  dueDate: Date
  message: string
}

/**
 * Build a repayment reminder for an active loan. Returns null when the loan is
 * not active or has no known due date.
 */
export function getRepaymentReminder(loan: LoanRequest): Reminder | null {
  if (!isActiveLoan(loan)) return null
  const dueDate = getDueDate(loan)
  if (!dueDate) return null

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDue = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
  const daysLeft = Math.round((startOfDue.getTime() - startOfToday.getTime()) / DAY_MS)

  const balance =
    loan.total_repayable != null
      ? Math.max(loan.total_repayable - (loan.amount_paid ?? 0), 0)
      : null
  const amount = balance != null ? `P${balance.toLocaleString()}` : `your ${loan.term_months ?? ''}-month loan`

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
