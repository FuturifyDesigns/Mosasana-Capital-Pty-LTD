import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  FileText,
  Clock,
  Info,
  CalendarClock,
  AlertTriangle,
  Wallet,
  History,
  TrendingDown,
  PartyPopper,
} from 'lucide-react'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { supabase, type LoanRequest, type LoanPayment } from '@/lib/supabase'
import { ACTIVE_LOAN_STATUSES } from '@/lib/constants'
import {
  formatDueDate,
  getEstimatedTotalRepayable,
  getInterestAndFeesAmount,
  getOutstandingBalance,
  getRepaymentReminder,
} from '@/lib/loans'
import { formatPula, toNumber } from '@/lib/format'
import {
  clientStatusBannerClass,
  LOAN_STATUS_META,
  statusBadgeClass,
  type LoanStatus,
} from '@/lib/loanStatus'

export function DashboardPage() {
  const { user, profile, isAdmin } = useAuth()
  const [loans, setLoans] = useState<LoanRequest[]>([])
  const [payments, setPayments] = useState<LoanPayment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLoans = useCallback(async () => {
    if (!user) return
    const { data: loanData } = await supabase
      .from('loan_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const loansList = (loanData as LoanRequest[]) || []
    setLoans(loansList)

    if (loansList.length > 0) {
      const ids = loansList.map((l) => l.id)
      const { data: paymentData } = await supabase
        .from('loan_payments')
        .select('*')
        .in('loan_id', ids)
        .order('created_at', { ascending: false })
      setPayments((paymentData as LoanPayment[]) || [])
    } else {
      setPayments([])
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loan_requests', filter: `user_id=eq.${user.id}` },
        () => fetchLoans(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_payments' }, () =>
        fetchLoans(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchLoans])

  const activeLoan = useMemo(
    () => loans.find((l) => (ACTIVE_LOAN_STATUSES as unknown as string[]).includes(l.status)),
    [loans],
  )

  const hasActiveLoan = !!activeLoan

  const reminders = useMemo(
    () =>
      loans
        .map((l) => ({ loan: l, reminder: getRepaymentReminder(l) }))
        .filter((r) => r.reminder && r.reminder.level !== 'ok'),
    [loans],
  )

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  const outstanding = activeLoan ? getOutstandingBalance(activeLoan) : null
  const estimatedTotal = activeLoan ? getEstimatedTotalRepayable(activeLoan) : null
  const displayTotal =
    activeLoan?.total_repayable != null
      ? toNumber(activeLoan.total_repayable)
      : estimatedTotal
  const paid = activeLoan ? toNumber(activeLoan.amount_paid) : 0
  const pct =
    displayTotal && displayTotal > 0 ? Math.min(Math.round((paid / displayTotal) * 100), 100) : 0

  return (
    <>
      <PageHero
        title="My Dashboard"
        subtitle={`Welcome back, ${profile?.full_name || user?.email || 'Client'}`}
      />

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Active loan summary */}
        {activeLoan && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-6 text-white shadow-xl shadow-brand-900/20"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-brand-100">Active loan</p>
                <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                  {outstanding != null ? formatPula(outstanding) : formatPula(activeLoan.loan_amount)}
                </p>
                <p className="mt-1 text-sm text-brand-100">
                  {outstanding != null ? 'Outstanding balance' : 'Principal amount'}
                  {' · '}
                  {activeLoan.loan_purpose}
                  {activeLoan.term_months ? ` · ${activeLoan.term_months} months` : ''}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  statusBadgeClass(activeLoan.status)
                }`}
              >
                {activeLoan.status}
              </span>
            </div>

            {displayTotal != null && (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-brand-100">
                  <span>
                    Paid {formatPula(paid)} of {formatPula(displayTotal)}
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-emerald-300 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-brand-100">
              {activeLoan.due_date && (
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4" />
                  Due {formatDueDate(activeLoan.due_date)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Wallet className="h-4 w-4" />
                Applied {formatPula(activeLoan.loan_amount)}
              </span>
            </div>

            <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs text-brand-50">
              Payments are recorded by our team when received (e.g. via WhatsApp or bank transfer).
              Your balance updates here automatically.
            </p>
          </motion.div>
        )}

        {/* Reminders */}
        {reminders.length > 0 && (
          <div className="mb-6 space-y-3">
            {reminders.map(({ loan, reminder }) => {
              const level = reminder!.level
              const styles =
                level === 'overdue'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : level === 'due'
                    ? 'border-orange-200 bg-orange-50 text-orange-800'
                    : 'border-yellow-200 bg-yellow-50 text-yellow-800'
              const Icon = level === 'overdue' ? AlertTriangle : CalendarClock
              return (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-2.5 rounded-xl border p-3.5 ${styles}`}
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold">Repayment reminder</p>
                    <p>{reminder!.message}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-brand-900">Your Loan Applications</h2>
          {hasActiveLoan ? (
            <Button size="sm" disabled title="Finish repaying your current loan to apply again">
              <Plus className="h-4 w-4" /> New Application
            </Button>
          ) : (
            <Link to="/apply">
              <Button size="sm">
                <Plus className="h-4 w-4" /> New Application
              </Button>
            </Link>
          )}
        </div>

        {hasActiveLoan && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/70 p-3 text-sm text-brand-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <p>
              You have an active loan. You&apos;ll be able to apply for a new one once your current
              loan is fully repaid.
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        ) : loans.length === 0 ? (
          <Card className="text-center">
            <FileText className="mx-auto h-12 w-12 text-brand-300" />
            <h3 className="mt-4 text-lg font-semibold text-brand-900">No Applications Yet</h3>
            <p className="mt-2 text-brand-600">Submit your first loan application to get started.</p>
            <Link to="/apply" className="mt-6 inline-block">
              <Button>Apply for a Loan</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {loans.map((loan, i) => {
              const loanPayments = payments.filter((p) => p.loan_id === loan.id)
              return (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="overflow-hidden !p-0">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-100 bg-brand-50/50 px-5 py-4">
                      <div>
                        <p className="text-2xl font-bold text-brand-900">
                          {formatPula(loan.loan_amount)}
                        </p>
                        <p className="mt-0.5 text-sm text-brand-600">
                          {loan.loan_purpose}
                          {loan.term_months ? ` · ${loan.term_months}-month term` : ''}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          statusBadgeClass(loan.status)
                        }`}
                      >
                        {loan.status}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-1.5 text-xs text-brand-500">
                        <Clock className="h-3.5 w-3.5" />
                        Applied{' '}
                        {new Date(loan.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>

                      <LoanStatusBanner status={loan.status as LoanStatus} />

                      {loan.status !== 'rejected' && loan.status !== 'discontinued' && (
                        <RepaymentSummary loan={loan} payments={loanPayments} />
                      )}

                      {loan.admin_notes && (
                        <p className="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
                          <span className="font-medium">Note from team:</span> {loan.admin_notes}
                        </p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}

function LoanStatusBanner({ status }: { status: LoanStatus }) {
  const meta = LOAN_STATUS_META[status]
  const Icon = status === 'paid' ? PartyPopper : Info

  return (
    <div
      className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${clientStatusBannerClass(meta.tone)}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">{meta.clientTitle}</p>
        <p className="mt-0.5 leading-relaxed opacity-90">{meta.clientMessage}</p>
      </div>
    </div>
  )
}

function RepaymentSummary({
  loan,
  payments,
}: {
  loan: LoanRequest
  payments: LoanPayment[]
}) {
  const total =
    loan.total_repayable != null
      ? toNumber(loan.total_repayable)
      : getEstimatedTotalRepayable(loan)
  const paid = toNumber(loan.amount_paid)
  const balance = getOutstandingBalance(loan) ?? Math.max(total - paid, 0)
  const pct = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0
  const termsSet = loan.total_repayable != null
  const fees = getInterestAndFeesAmount(loan)

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-brand-50 p-4 ring-1 ring-emerald-100">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-emerald-700">
              <TrendingDown className="h-3.5 w-3.5" />
              Outstanding
            </p>
            <p className="text-2xl font-bold text-emerald-900">
              {termsSet || loan.status === 'paid' ? formatPula(balance) : 'Pending'}
            </p>
            {!termsSet && loan.status !== 'paid' && (
              <p className="mt-0.5 text-xs text-brand-500">
                Final amount will be confirmed once your loan is approved
              </p>
            )}
          </div>
          <div className="text-right text-sm text-brand-700">
            <p>
              Paid <strong>{formatPula(paid)}</strong>
            </p>
            <p className="text-xs text-brand-500">of {formatPula(total)} total</p>
            {fees != null && fees > 0 && (
              <p className="text-xs text-amber-700">Includes {formatPula(fees)} interest/fees</p>
            )}
          </div>
        </div>
        {(termsSet || paid > 0) && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        {loan.due_date && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-500">
            <CalendarClock className="h-3.5 w-3.5" /> Due {formatDueDate(loan.due_date)}
          </p>
        )}
        {loan.interest_rate === 0 && (
          <p className="mt-1 text-xs text-brand-500">0% interest — principal only</p>
        )}
      </div>

      {payments.length > 0 && (
        <div className="rounded-xl border border-brand-100 bg-white p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600">
            <History className="h-3.5 w-3.5" />
            Payment history
          </p>
          <ul className="space-y-1.5">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-brand-50/80 px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium text-brand-900">{formatPula(p.amount)}</span>
                  {(p.interest_rate_snapshot != null || p.total_repayable_snapshot != null) && (
                    <p className="text-[11px] text-brand-500">
                      Terms at payment:
                      {p.interest_rate_snapshot != null
                        ? ` ${p.interest_rate_snapshot}% interest`
                        : ' interest N/A'}
                      {p.total_repayable_snapshot != null
                        ? ` · total ${formatPula(p.total_repayable_snapshot)}`
                        : ''}
                    </p>
                  )}
                </div>
                <span className="text-xs text-brand-400">
                  {new Date(p.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
