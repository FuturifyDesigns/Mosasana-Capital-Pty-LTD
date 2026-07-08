import { useEffect, useMemo, useState } from 'react'
import { Percent, Wallet, Plus, History, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DEFAULT_MONTHLY_INTEREST_RATE } from '@/lib/constants'
import { formatPula, toNumber } from '@/lib/format'
import {
  calculateInterestAmount,
  calculateTotalRepayable,
  canRecordPayments,
  formatDueDate,
  getDueDate,
  getOutstandingBalance,
  parseInterestRateInput,
  resolveInterestRate,
} from '@/lib/loans'
import type { LoanPayment, LoanRequest } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'
import { sanitizeText } from '@/lib/validation'

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

function storedRateLabel(loan: LoanRequest): string {
  if (loan.interest_rate !== null && loan.interest_rate !== undefined) {
    return String(loan.interest_rate)
  }
  return String(DEFAULT_MONTHLY_INTEREST_RATE)
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
  const suggestedRate = resolveInterestRate(loan.interest_rate)
  const estimatedTotal = calculateTotalRepayable(principal, term, suggestedRate)

  const [rate, setRate] = useState(storedRateLabel(loan))
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
  const [additionalFee, setAdditionalFee] = useState('')
  const [savingTerms, setSavingTerms] = useState(false)
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    const r = resolveInterestRate(loan.interest_rate)
    setRate(
      loan.interest_rate !== null && loan.interest_rate !== undefined
        ? String(loan.interest_rate)
        : String(r),
    )
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

  const rateNum = parseInterestRateInput(rate) ?? DEFAULT_MONTHLY_INTEREST_RATE
  const previewInterest = calculateInterestAmount(principal, term, rateNum)
  const previewTotal = calculateTotalRepayable(principal, term, rateNum)
  const isZeroInterest = rateNum === 0

  const totalNum = total === '' ? null : Number(total)
  const paidNum = toNumber(loan.amount_paid)
  const hasPayments = paidNum > 0
  const minTotal = Math.max(principal, paidNum)
  const savedTotal = loan.total_repayable != null ? toNumber(loan.total_repayable) : null
  const balance = getOutstandingBalance(loan) ?? (totalNum != null ? Math.max(totalNum - paidNum, 0) : null)
  const pct =
    totalNum && totalNum > 0 ? Math.min(Math.round((paidNum / totalNum) * 100), 100) : 0

  const termsDirty = useMemo(() => {
    const savedRate = storedRateLabel(loan)
    const savedDue = loan.due_date ?? ''
    const expectedTotal =
      loan.total_repayable != null ? String(loan.total_repayable) : String(estimatedTotal)
    return total !== expectedTotal || rate !== savedRate || due !== savedDue
  }, [total, rate, due, loan, estimatedTotal])

  const applyCalculatedTerms = () => {
    if (hasPayments && savedTotal != null) {
      const extra = isZeroInterest ? 0 : previewInterest
      if (extra <= 0) {
        showToast('Set an interest rate above 0% to add calculated interest, or use the fee field.', 'info')
        return
      }
      const newTotal = Math.round((savedTotal + extra) * 100) / 100
      setTotal(String(newTotal))
      showToast(
        `Added ${formatPula(extra)} interest/fee for delayed payment. New total: ${formatPula(newTotal)}.`,
        'info',
      )
      return
    }
    setTotal(String(previewTotal))
    if (isZeroInterest) {
      showToast(`No interest — total is ${formatPula(principal)} (principal only).`, 'info')
    } else {
      showToast(
        `Calculated: ${formatPula(principal)} + ${formatPula(previewInterest)} interest`,
        'info',
      )
    }
  }

  const addAdditionalFee = () => {
    const fee = Number(additionalFee)
    if (!fee || fee <= 0 || !Number.isFinite(fee)) {
      showToast('Enter a valid additional interest or late fee amount.', 'error')
      return
    }
    const base = totalNum ?? savedTotal ?? previewTotal
    const newTotal = Math.round((base + fee) * 100) / 100
    setTotal(String(newTotal))
    setAdditionalFee('')
    showToast(`Added ${formatPula(fee)}. New total repayable: ${formatPula(newTotal)}.`, 'info')
  }

  const setZeroInterest = () => {
    setRate('0')
    setTotal(String(principal))
    showToast('0% interest — total set to principal only.', 'info')
  }

  const validateTerms = (): string | null => {
    const parsedRate = parseInterestRateInput(rate)
    if (parsedRate === null) return 'Enter a valid interest rate between 0 and 100.'
    if (total === '' || totalNum == null || totalNum <= 0) {
      return 'Total repayable must be greater than zero.'
    }
    if (totalNum < minTotal) {
      return `Total cannot be less than ${formatPula(minTotal)} (principal or amount already paid).`
    }
    if (parsedRate === 0 && !hasPayments && totalNum !== principal) {
      return `With 0% interest and no payments yet, total must equal the principal (${formatPula(principal)}).`
    }
    if (due === '') return 'Set a due date before saving repayment terms.'
    return null
  }

  const handleSaveTerms = async () => {
    const err = validateTerms()
    if (err) {
      showToast(err, 'error')
      return
    }
    setSavingTerms(true)
    await onSaveTerms(loan.id, {
      total_repayable: totalNum,
      due_date: due,
      interest_rate: parseInterestRateInput(rate),
    })
    setSavingTerms(false)
    showToast('Repayment terms saved.', 'success')
  }

  const handleRecordPayment = async () => {
    if (!canRecordPayments(loan)) {
      showToast('Payments can only be recorded on approved or disbursed loans.', 'error')
      return
    }
    if (loan.total_repayable == null || toNumber(loan.total_repayable) <= 0) {
      showToast('Save repayment terms (total repayable) before recording payments.', 'error')
      return
    }
    if (loan.status === 'paid' || (balance != null && balance <= 0)) {
      showToast('This loan is already fully repaid.', 'error')
      return
    }

    const amount = Number(paymentAmount)
    if (!amount || amount <= 0 || !Number.isFinite(amount)) {
      showToast('Enter a valid payment amount.', 'error')
      return
    }
    if (balance != null && amount > balance + 0.01) {
      showToast(`Payment cannot exceed outstanding balance of ${formatPula(balance)}.`, 'error')
      return
    }

    setRecording(true)
    const { error } = await supabase.rpc('record_loan_payment', {
      p_loan_id: loan.id,
      p_amount: Math.round(amount * 100) / 100,
      p_notes: paymentNotes.trim() ? sanitizeText(paymentNotes).slice(0, 500) : null,
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
  const paymentsAllowed = canRecordPayments(loan) && loan.status !== 'paid'

  const renderTermsBlock = () => (
    <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-white p-4 ring-1 ring-brand-100">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-800">
        <Percent className="h-4 w-4 text-brand-500" />
        Loan terms & interest
      </p>
      {hasPayments && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {formatPula(paidNum)} already recorded. You can add <strong>late fees or additional interest</strong>{' '}
            for delayed payments — increase the total below, then save. The customer will be notified automatically.
          </p>
        </div>
      )}
      <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl bg-white p-2.5 ring-1 ring-brand-100">
          <p className="text-brand-500">Principal</p>
          <p className="mt-1 font-bold text-brand-900">{formatPula(principal)}</p>
        </div>
        <div className="rounded-xl bg-white p-2.5 ring-1 ring-brand-100">
          <p className="text-brand-500">Interest / fees</p>
          <p className="mt-1 font-bold text-amber-700">
            {totalNum != null && totalNum > principal
              ? formatPula(totalNum - principal)
              : isZeroInterest
                ? 'None'
                : formatPula(previewInterest)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-2.5 ring-1 ring-brand-100">
          <p className="text-brand-500">Total due</p>
          <p className="mt-1 font-bold text-brand-900">{formatPula(totalNum ?? previewTotal)}</p>
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
            placeholder="0 for no interest"
            className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <label className="text-xs font-medium text-brand-600">
          Total repayable
          <input
            type="number"
            min={minTotal}
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
        {!hasPayments && (
          <Button type="button" variant="outline" size="sm" onClick={setZeroInterest}>
            No interest (0%)
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" onClick={applyCalculatedTerms}>
          {hasPayments
            ? isZeroInterest
              ? 'Add calculated fee'
              : `Add ${rateNum}% interest`
            : isZeroInterest
              ? 'Apply principal only'
              : `Apply ${rateNum}% interest`}
        </Button>
        <Button type="button" size="sm" onClick={handleSaveTerms} disabled={!termsDirty || savingTerms}>
          {savingTerms ? 'Saving…' : 'Save terms'}
        </Button>
      </div>
      {hasPayments && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-brand-100 pt-3">
          <label className="flex-1 text-xs font-medium text-brand-600">
            Additional interest / late fee (P)
            <input
              type="number"
              min="0"
              step="0.01"
              value={additionalFee}
              onChange={(e) => setAdditionalFee(e.target.value)}
              placeholder="e.g. 500"
              className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <Button type="button" variant="outline" size="sm" onClick={addAdditionalFee} className="shrink-0">
            Add to total
          </Button>
        </div>
      )}
    </div>
  )

  if (['rejected', 'pending', 'reviewing'].includes(loan.status)) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-4 text-sm text-brand-600">
        Set repayment terms once this loan is approved or disbursed.
      </div>
    )
  }

  if (loan.status === 'paid') {
    return (
      <div className="mt-5 space-y-4 border-t border-brand-100 pt-5">
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-100">
          <p className="font-semibold">Loan marked as fully repaid</p>
          <p className="mt-1">
            Total received: {formatPula(paidNum)} of {formatPula(loan.total_repayable ?? principal)}.
            To add late fees or interest for delays, increase the total below and save — the loan will reopen
            and the customer will be notified.
          </p>
        </div>
        {renderTermsBlock()}
        {loanPayments.length > 0 && <PaymentHistoryList payments={loanPayments} />}
      </div>
    )
  }

  return (
    <div className="mt-5 space-y-4 border-t border-brand-100 pt-5">
      {renderTermsBlock()}

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
              {loan.interest_rate === 0 && (
                <p className="mt-0.5 text-xs text-emerald-600">0% interest applied</p>
              )}
            </div>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {paymentsAllowed && (
        <div className="rounded-2xl border border-brand-100 bg-white p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-800">
            <Wallet className="h-4 w-4 text-brand-500" />
            Record payment received
          </p>
          {loan.total_repayable == null ? (
            <p className="text-sm text-amber-700">Save repayment terms before recording payments.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="number"
                min="0"
                max={balance ?? undefined}
                step="0.01"
                placeholder="Amount (P)"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <input
                type="text"
                maxLength={500}
                placeholder="Notes (optional, e.g. WhatsApp ref)"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleRecordPayment}
                disabled={recording || balance === 0}
              >
                <Plus className="h-4 w-4" />
                {recording ? 'Recording…' : 'Record'}
              </Button>
            </div>
          )}
        </div>
      )}

      {loanPayments.length > 0 && <PaymentHistoryList payments={loanPayments} />}
    </div>
  )
}

function PaymentHistoryList({ payments }: { payments: LoanPayment[] }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-800">
        <History className="h-4 w-4 text-brand-500" />
        Payment history
      </p>
      <ul className="max-h-40 space-y-2 overflow-y-auto">
        {payments.map((p) => (
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
  )
}
