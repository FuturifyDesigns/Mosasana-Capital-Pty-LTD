import { ACTIVE_LOAN_STATUSES } from './constants'
import { toNumber } from './format'
import { getOutstandingBalance } from './loans'
import type { AdminUser, LoanRequest } from './supabase'

export type ClientRecordsFilter = 'all' | 'funded' | 'active' | 'settled' | 'rejected'

export interface ClientRecord {
  key: string
  userId: string | null
  displayName: string
  email: string
  phone: string
  idNumber: string
  address: string
  loans: LoanRequest[]
  loanCount: number
  fundedCount: number
  paidCount: number
  activeCount: number
  rejectedCount: number
  totalPrincipal: number
  totalRepaid: number
  totalOutstanding: number
  firstLoanAt: string
  lastLoanAt: string
}

function clientKey(loan: LoanRequest): string {
  return loan.user_id ?? loan.email.trim().toLowerCase()
}

export function buildClientRecords(loans: LoanRequest[], users: AdminUser[] = []): ClientRecord[] {
  const userById = new Map(users.map((u) => [u.id, u]))
  const groups = new Map<string, LoanRequest[]>()

  for (const loan of loans) {
    const key = clientKey(loan)
    const list = groups.get(key) ?? []
    list.push(loan)
    groups.set(key, list)
  }

  const records: ClientRecord[] = []

  for (const [key, clientLoans] of groups) {
    const sorted = [...clientLoans].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    const latest = sorted[0]
    const profile = latest.user_id ? userById.get(latest.user_id) : undefined

    const paidCount = sorted.filter((l) => l.status === 'paid').length
    const activeCount = sorted.filter((l) =>
      (ACTIVE_LOAN_STATUSES as readonly string[]).includes(l.status),
    ).length
    const rejectedCount = sorted.filter((l) => l.status === 'rejected' || l.status === 'discontinued').length
    const fundedCount = sorted.filter((l) => ['disbursed', 'paid'].includes(l.status)).length

    const totalPrincipal = sorted
      .filter((l) => !['rejected', 'discontinued'].includes(l.status))
      .reduce((sum, l) => sum + toNumber(l.loan_amount), 0)

    const totalRepaid = sorted.reduce((sum, l) => sum + toNumber(l.amount_paid), 0)

    const totalOutstanding = sorted
      .filter((l) => !['rejected', 'paid', 'discontinued'].includes(l.status))
      .reduce((sum, l) => sum + (getOutstandingBalance(l) ?? 0), 0)

    records.push({
      key,
      userId: latest.user_id,
      displayName: profile?.full_name || latest.full_name,
      email: profile?.email && profile.email !== '—' ? profile.email : latest.email,
      phone: profile?.phone || latest.phone,
      idNumber: latest.id_number,
      address: latest.physical_address,
      loans: sorted,
      loanCount: sorted.length,
      fundedCount,
      paidCount,
      activeCount,
      rejectedCount,
      totalPrincipal,
      totalRepaid,
      totalOutstanding,
      firstLoanAt: sorted[sorted.length - 1].created_at,
      lastLoanAt: sorted[0].created_at,
    })
  }

  return records.sort(
    (a, b) => new Date(b.lastLoanAt).getTime() - new Date(a.lastLoanAt).getTime(),
  )
}

export function filterClientRecords(
  records: ClientRecord[],
  filter: ClientRecordsFilter,
): ClientRecord[] {
  switch (filter) {
    case 'funded':
      return records.filter((r) => r.fundedCount > 0)
    case 'active':
      return records.filter((r) => r.activeCount > 0)
    case 'settled':
      return records.filter((r) => r.paidCount > 0 && r.activeCount === 0)
    case 'rejected':
      return records.filter((r) => r.rejectedCount > 0 && r.fundedCount === 0)
    case 'all':
    default:
      return records
  }
}
