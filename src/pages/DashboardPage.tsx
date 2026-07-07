import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, FileText, Clock, Info, CalendarClock, AlertTriangle } from 'lucide-react'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { supabase, type LoanRequest } from '@/lib/supabase'
import { ACTIVE_LOAN_STATUSES } from '@/lib/constants'
import { getRepaymentReminder } from '@/lib/loans'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  disbursed: 'bg-brand-100 text-brand-800',
  paid: 'bg-emerald-100 text-emerald-800',
}

export function DashboardPage() {
  const { user, profile } = useAuth()
  const [loans, setLoans] = useState<LoanRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLoans = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('loan_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setLoans((data as LoanRequest[]) || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  // Live updates when an admin changes the status or records a payment.
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loan_requests', filter: `user_id=eq.${user.id}` },
        () => fetchLoans(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchLoans])

  const hasActiveLoan = useMemo(
    () => loans.some((l) => (ACTIVE_LOAN_STATUSES as unknown as string[]).includes(l.status)),
    [loans],
  )

  const reminders = useMemo(
    () =>
      loans
        .map((l) => ({ loan: l, reminder: getRepaymentReminder(l) }))
        .filter((r) => r.reminder && r.reminder.level !== 'ok'),
    [loans],
  )

  return (
    <>
      <PageHero
        title="My Dashboard"
        subtitle={`Welcome back, ${profile?.full_name || user?.email || 'Client'}`}
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
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
          <div className="mb-8 flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/70 p-3 text-sm text-brand-700">
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
              <div key={i} className="skeleton h-24 rounded-2xl" />
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
            {loans.map((loan, i) => (
              <motion.div
                key={loan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card hover>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-brand-900">
                        P{loan.loan_amount.toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm text-brand-600">
                        {loan.loan_purpose}
                        {loan.term_months ? ` · ${loan.term_months}-month term` : ''}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-500">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(loan.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        statusColors[loan.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {loan.status}
                    </span>
                  </div>
                  {loan.total_repayable != null && loan.status !== 'rejected' && (
                    <RepaymentProgress loan={loan} />
                  )}
                  {loan.admin_notes && (
                    <p className="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
                      <span className="font-medium">Note:</span> {loan.admin_notes}
                    </p>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function RepaymentProgress({ loan }: { loan: LoanRequest }) {
  const total = loan.total_repayable ?? 0
  const paid = loan.amount_paid ?? 0
  const balance = Math.max(total - paid, 0)
  const pct = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0

  return (
    <div className="mt-3 rounded-lg bg-brand-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <span className="text-brand-600">
          Repaid <strong className="text-brand-900">P{paid.toLocaleString()}</strong> of{' '}
          P{total.toLocaleString()}
        </span>
        <span className="text-brand-600">
          Balance: <strong className="text-brand-900">P{balance.toLocaleString()}</strong>
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      {loan.due_date && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-500">
          <Clock className="h-3.5 w-3.5" /> Due{' '}
          {new Date(loan.due_date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      )}
    </div>
  )
}
