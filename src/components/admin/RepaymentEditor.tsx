import { useEffect, useMemo, useState } from 'react'
import { Percent, Wallet, Plus, History } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DEFAULT_MONTHLY_INTEREST_RATE } from '@/lib/constants'
import { formatPula, toNumber } from '@/lib/format'
import {
  calculateInterestAmount,
  calculateTotalRepayable,
  formatDueDate,
  getDueDate,
  getOutstandingBalance,
} from '@/lib/loans'
import type { LoanPayment, LoanRequest } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'

interface RepaymentEditorProps {
  loan: LoanRequest
  payments: LoanPayment[]
  onSaveTerms: (
    id: string,
    fields: {
      total_repayable: number | null
      due_date: string | null
      interest_rate: number | null
    },
  ) => Promise<void>
  onPaymentRecorded: () => void
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function RepaymentEditor({
  loan,
  payments,
  onSaveTerms,
  onPaymentRecorded,
}: RepaymentEditorProps) {
  const { showToast } = useToast()
  const principal = toNumber(loan.loan_amount)
  const term = loan.term_months ?? 1

  const defaultRate = loan.interest_rate ?? DEFAULT_MONTHLY_INTEREST_RATE
  const estimatedTotal = calculateTotalRepayable(principal, term, defaultRate)

  const [rate, setRate] = useState(String(defaultRate))
  const [total, setTotal] = useState(
    loan.total_repayable != null ? String(loan.total_repayable) : String(estimatedTotal),
  )
  const [due, setDue] = useState(() => {
    if (loan.due_date) return loan.due_date
    const d = getDueDate(loan)
    return d ? toDateInputValue(d) : ''
  })
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [savingTerms, setSavingTerms] = useState(false)
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    const r = loan.interest_rate ?? DEFAULT_MONTHLY_INTEREST_RATE
    setRate(String(r))
    setTotal(
      loan.total_repayable != null
        ? String(loan.total_repayable)
        : String(calculateTotalRepayable(principal, term, r)),
    )
    if (loan.due_date) setDue(loan.due_date)
    else {
      const d = getDueDate(loan)
      setDue(d ? toDateInputValue(d) : '')
    }
  }, [loan.id, loan.total_repayable, loan.interest_rate, loan.due_date, principal, term])

  const rateNum = Number(rate) || DEFAULT_MONTHLY_INTEREST_RATE
  const previewInterest = calculateInterestAmount(principal, term, rateNum)
  const previewTotal = calculateTotalRepayable(principal, term, rateNum)

  const totalNum = total === '' ? null : Number(total)
  const paidNum = toNumber(loan.amount_paid)
  const balance = getOutstandingBalance(loan) ?? (totalNum != null ? Math.max(totalNum - paidNum, 0) : null)
  const pct =
    totalNum && totalNum > 0 ? Math.min(Math.round((paidNum / totalNum) * 100), 100) : 0

  const termsDirty = useMemo(() => {
    const savedRate = String(loan.interest_rate ?? DEFAULT_MONTHLY_INTEREST_RATE)
    const savedDue = loan.due_date ?? ''
    const expectedTotal =
      loan.total_repayable != null ? String(loan.total_repayable) : String(estimatedTotal)
    return total !== expectedTotal || rate !== savedRate || due !== savedDue
  }, [total, rate, due, loan.interest_rate, loan.total_repayable, loan.due_date, estimatedTotal])

  const applyInterest = () => {
    setRate(String(rateNum))
    setTotal(String(previewTotal))
    showToast(`Calculated: ${formatPula(principal)} + ${formatPula(previewInterest)} interest`, 'info')
  }

  const handleSaveTerms = async () => {
    setSavingTerms(true)
    await onSaveTerms(loan.id, {
      total_repayable: total === '' ? null : Number(total),
      due_date: due === '' ? null : due,
      interest_rate: rate === '' ? null : Number(rate),
    })
    setSavingTerms(false)
    showToast('Repayment terms saved.', 'success')
  }

  const handleRecordPayment = async () => {
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) {
      showToast('Enter a valid payment amount.', 'error')
      return
    }
    setRecording(true)
    const { error } = await supabase.rpc('record_loan_payment', {
      p_loan_id: loan.id,
      p_amount: amount,
      p_notes: paymentNotes.trim() || null,
    })
    setRecording(false)
    if (error) {
      showToast(error.message || 'Could not record payment. Run fix-live-db.sql in Supabase.', 'error')
      return
    }
    setPaymentAmount('')
    setPaymentNotes('')
    showToast(`Payment of ${formatPula(amount)} recorded.`, 'success')
    onPaymentRecorded()
  }

  const loanPayments = payments.filter((p) => p.loan_id === loan.id)

  if (['rejected', 'pending', 'reviewing'].includes(loan.status)) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-4 text-sm text-brand-600">
        Set repayment terms once this loan is approved or disbursed.
      </div>
    )
  }

  return (
    <div className="mt-5 space-y-4 border-t border-brand-100 pt-5">
      {/* Interest & terms */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-white p-4 ring-1 ring-brand-100">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-800">
          <Percent className="h-4 w-4 text-brand-500" />
          Loan terms & interest
        </p>
        <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-white p-2.5 ring-1 ring-brand-100">
            <p className="text-brand-500">Principal</p>
            <p className="mt-1 font-bold text-brand-900">{formatPula(principal)}</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 ring-1 ring-brand-100">
            <p className="text-brand-500">Interest</p>
            <p className="mt-1 font-bold text-amber-700">{formatPula(previewInterest)}</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 ring-1 ring-brand-100">
            <p className="text-brand-500">Total due</p>
            <p className="mt-1 font-bold text-brand-900">{formatPula(previewTotal)}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-xs font-medium text-brand-600">
            Monthly interest (%)
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="text-xs font-medium text-brand-600">
            Total repayable
            <input
              type="number"
              min="0"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="text-xs font-medium text-brand-600">
            Due date
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={applyInterest}>
            Apply {rateNum}% interest
          </Button>
          <Button type="button" size="sm" onClick={handleSaveTerms} disabled={!termsDirty || savingTerms}>
            {savingTerms ? 'Saving…' : 'Save terms'}
          </Button>
        </div>
      </div>

      {/* Balance summary */}
      {totalNum != null && (
        <div className="rounded-2xl bg-emerald-50/60 p-4 ring-1 ring-emerald-100">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Outstanding</p>
              <p className="text-2xl font-bold text-emerald-900">{formatPula(balance ?? 0)}</p>
            </div>
            <div className="text-right text-sm text-emerald-800">
              <p>
                Paid: <strong>{formatPula(paidNum)}</strong> of {formatPula(totalNum)}
              </p>
              {due && <p className="mt-0.5 text-xs text-emerald-600">Due {formatDueDate(due)}</p>}
            </div>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {balance === 0 && totalNum > 0 && (
            <p className="mt-2 text-xs font-medium text-emerald-700">
              Fully repaid — loan will be marked as paid.
            </p>
          )}
        </div>
      )}

      {/* Record payment (admin only) */}
      <div className="rounded-2xl border border-brand-100 bg-white p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-800">
          <Wallet className="h-4 w-4 text-brand-500" />
          Record payment received
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            type="number"
            min="0"
            placeholder="Amount (P)"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <input
            type="text"
            placeholder="Notes (optional, e.g. WhatsApp ref)"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            className="rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <Button type="button" size="sm" onClick={handleRecordPayment} disabled={recording}>
            <Plus className="h-4 w-4" />
            {recording ? 'Recording…' : 'Record'}
          </Button>
        </div>
      </div>

      {/* Payment history */}
      {loanPayments.length > 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-800">
            <History className="h-4 w-4 text-brand-500" />
            Payment history
          </p>
          <ul className="max-h-40 space-y-2 overflow-y-auto">
            {loanPayments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-brand-50/80 px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-semibold text-brand-900">{formatPula(p.amount)}</span>
                  {p.notes && <span className="ml-2 text-brand-500">— {p.notes}</span>}
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
