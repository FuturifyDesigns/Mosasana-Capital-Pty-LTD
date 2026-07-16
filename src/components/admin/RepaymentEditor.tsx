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
  getEffectivePrincipal,
  getDueDate,
  getOutstandingBalance,
  parseInterestRateInput,
  resolveInterestRate,
} from '@/lib/loans'
import type { LoanPayment, LoanRequest } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'
import { useLanguage } from '@/context/LanguageContext'
import { sanitizeText } from '@/lib/validation'

interface RepaymentEditorProps {
  loan: LoanRequest
  payments: LoanPayment[]
  onSaveTerms: (
    id: string,
    fields: {
      disbursed_amount: number | null
      total_repayable: number | null
      due_date: string | null
      interest_rate: number | null
    },
  ) => void | Promise<void>
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
  const { t } = useLanguage()
  const requestedAmount = toNumber(loan.loan_amount)
  const principal = getEffectivePrincipal(loan)
  const term = loan.term_months ?? 1
  const suggestedRate = resolveInterestRate(loan.interest_rate)
  const estimatedTotal = calculateTotalRepayable(principal, term, suggestedRate)

  const [disbursedAmount, setDisbursedAmount] = useState(
    loan.disbursed_amount != null ? String(loan.disbursed_amount) : String(principal),
  )
  const [rate, setRate] = useState(storedRateLabel(loan))
  const [total, setTotal] = useState(
    loan.total_repayable != null ? String(loan.total_repayable) : String(estimatedTotal),
  )
  const [totalEdited, setTotalEdited] = useState(false)
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
    const r = resolveInterestRate(loan.interest_rate)
    const nextPrincipal = getEffectivePrincipal(loan)
    setDisbursedAmount(
      loan.disbursed_amount != null ? String(loan.disbursed_amount) : String(nextPrincipal),
    )
    setRate(
      loan.interest_rate !== null && loan.interest_rate !== undefined
        ? String(loan.interest_rate)
        : String(r),
    )
    setTotal(
      loan.total_repayable != null
        ? String(loan.total_repayable)
        : String(calculateTotalRepayable(nextPrincipal, term, r)),
    )
    setTotalEdited(false)
    if (loan.due_date) setDue(loan.due_date)
    else {
      const d = getDueDate(loan)
      setDue(d ? toDateInputValue(d) : '')
    }
  }, [loan.id, loan.disbursed_amount, loan.total_repayable, loan.interest_rate, loan.due_date, term])

  const disbursedNum = disbursedAmount === '' ? null : Number(disbursedAmount)
  const rateNum = parseInterestRateInput(rate) ?? DEFAULT_MONTHLY_INTEREST_RATE
  const previewPrincipal =
    disbursedNum != null && Number.isFinite(disbursedNum) && disbursedNum > 0 ? disbursedNum : principal
  const previewInterest = calculateInterestAmount(previewPrincipal, term, rateNum)
  const previewTotal = calculateTotalRepayable(previewPrincipal, term, rateNum)

  const totalNum = total === '' ? null : Number(total)
  const paidNum = toNumber(loan.amount_paid)
  const hasPayments = paidNum > 0
  const savedTotal = loan.total_repayable != null ? toNumber(loan.total_repayable) : null
  const balance =
    getOutstandingBalance(loan) ?? (totalNum != null ? Math.max(totalNum - paidNum, 0) : null)
  const pct = totalNum && totalNum > 0 ? Math.min(Math.round((paidNum / totalNum) * 100), 100) : 0

  const termsDirty = useMemo(() => {
    const savedDisbursed =
      loan.disbursed_amount != null ? String(loan.disbursed_amount) : String(principal)
    const savedRate = storedRateLabel(loan)
    const savedDue = loan.due_date ?? ''
    const expectedTotal =
      loan.total_repayable != null ? String(loan.total_repayable) : String(estimatedTotal)
    return (
      disbursedAmount !== savedDisbursed ||
      total !== expectedTotal ||
      rate !== savedRate ||
      due !== savedDue
    )
  }, [disbursedAmount, total, rate, due, loan, estimatedTotal, principal])

  const autoTotalFromRate = (basePrincipal: number, parsedRate: number): number => {
    // If payments already exist, applying a new rate should add extra charges to the current total.
    if (hasPayments && savedTotal != null) {
      return Math.max(calculateTotalRepayable(basePrincipal, term, parsedRate), paidNum)
    }
    return calculateTotalRepayable(basePrincipal, term, parsedRate)
  }

  const validateTerms = (
    candidatePrincipal: number | null,
    candidateTotal: number | null,
    parsedRate: number | null,
  ): string | null => {
    if (candidatePrincipal == null || !Number.isFinite(candidatePrincipal) || candidatePrincipal <= 0) {
      return t('admin.repayment.disbursedAmountPositive')
    }
    if (candidatePrincipal > requestedAmount) {
      return t('admin.repayment.disbursedAmountTooHigh', { amount: formatPula(requestedAmount) })
    }
    if (parsedRate === null) return t('admin.repayment.invalidInterestRate')
    if (candidateTotal == null || candidateTotal <= 0) {
      return t('admin.repayment.totalMustBePositive')
    }
    const minTotal = Math.max(candidatePrincipal, paidNum)
    if (candidateTotal < minTotal) {
      return t('admin.repayment.totalTooLow', { min: formatPula(minTotal) })
    }
    if (parsedRate === 0 && !hasPayments && candidateTotal !== candidatePrincipal) {
      return t('admin.repayment.zeroInterestTotalMismatch', { principal: formatPula(candidatePrincipal) })
    }
    if (due === '') return t('admin.repayment.dueDateRequired')
    return null
  }

  const handleSaveTerms = async () => {
    const parsedRate = parseInterestRateInput(rate)
    const previousRate = parseInterestRateInput(storedRateLabel(loan))
    const rateChanged = parsedRate !== previousRate
    const savedDisbursed =
      loan.disbursed_amount != null ? String(loan.disbursed_amount) : String(principal)
    const principalChanged = disbursedAmount !== savedDisbursed
    const candidatePrincipal =
      disbursedNum != null && Number.isFinite(disbursedNum) && disbursedNum > 0 ? disbursedNum : null

    let candidateTotal = totalNum

    // If admin changed interest rate or payout amount but didn't type total manually, apply it automatically.
    if (!totalEdited && (rateChanged || principalChanged) && parsedRate != null && candidatePrincipal != null) {
      candidateTotal = autoTotalFromRate(candidatePrincipal, parsedRate)
      setTotal(String(candidateTotal))
    }

    const err = validateTerms(candidatePrincipal, candidateTotal, parsedRate)
    if (err) {
      showToast(err, 'error')
      return
    }

    setSavingTerms(true)
    await onSaveTerms(loan.id, {
      disbursed_amount: candidatePrincipal,
      total_repayable: candidateTotal,
      due_date: due,
      interest_rate: parsedRate,
    })
    setSavingTerms(false)
    setTotalEdited(false)
    showToast(t('admin.repayment.termsSaved'), 'success')
  }

  const handleRecordPayment = async () => {
    if (!canRecordPayments(loan)) {
      showToast(t('admin.repayment.paymentsOnlyApproved'), 'error')
      return
    }
    if (loan.total_repayable == null || toNumber(loan.total_repayable) <= 0) {
      showToast(t('admin.repayment.saveTermsBeforePayment'), 'error')
      return
    }
    if (loan.status === 'paid' || (balance != null && balance <= 0)) {
      showToast(t('admin.repayment.alreadyFullyRepaid'), 'error')
      return
    }

    const amount = Number(paymentAmount)
    if (!amount || amount <= 0 || !Number.isFinite(amount)) {
      showToast(t('admin.repayment.invalidPaymentAmount'), 'error')
      return
    }
    if (balance != null && amount > balance + 0.01) {
      showToast(t('admin.repayment.paymentExceedsBalance', { balance: formatPula(balance) }), 'error')
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
      showToast(error.message || t('admin.repayment.paymentRecordFailed'), 'error')
      return
    }
    setPaymentAmount('')
    setPaymentNotes('')
    showToast(t('admin.repayment.paymentRecorded', { amount: formatPula(amount) }), 'success')
    onPaymentRecorded()
  }

  const loanPayments = payments.filter((p) => p.loan_id === loan.id)
  const paymentsAllowed = canRecordPayments(loan) && loan.status !== 'paid'

  const renderTermsBlock = () => (
    <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-white p-4 ring-1 ring-brand-100">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-800">
        <Percent className="h-4 w-4 text-brand-500" />
        {t('admin.repayment.termsTitle')}
      </p>
      {loan.status === 'approved' && loan.total_repayable == null && (
        <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
          {t('admin.repayment.termsRequired')}
        </div>
      )}
      {hasPayments && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t('admin.repayment.paymentsRecorded', { amount: formatPula(paidNum) })}</p>
        </div>
      )}
      <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl bg-white p-2.5 ring-1 ring-brand-100">
          <p className="text-brand-500">{t('admin.repayment.requestedAmount')}</p>
          <p className="mt-1 font-bold text-brand-900">{formatPula(requestedAmount)}</p>
        </div>
        <div className="rounded-xl bg-white p-2.5 ring-1 ring-brand-100">
          <p className="text-brand-500">{t('admin.repayment.interestFees')}</p>
          <p className="mt-1 font-bold text-amber-700">
            {totalNum != null && totalNum > previewPrincipal
              ? formatPula(totalNum - previewPrincipal)
              : rateNum === 0
                ? t('admin.repayment.none')
                : formatPula(previewInterest)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-2.5 ring-1 ring-brand-100">
          <p className="text-brand-500">{t('admin.repayment.totalDue')}</p>
          <p className="mt-1 font-bold text-brand-900">{formatPula(totalNum ?? previewTotal)}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <label className="text-xs font-medium text-brand-600">
          {t('admin.repayment.disbursedAmount')}
          <input
            type="number"
            min="0"
            max={requestedAmount}
            step="0.01"
            value={disbursedAmount}
            onChange={(e) => setDisbursedAmount(e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <label className="text-xs font-medium text-brand-600">
          {t('admin.repayment.monthlyInterest')}
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            placeholder={t('admin.repayment.interestPlaceholder')}
            className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <label className="text-xs font-medium text-brand-600">
          {t('admin.repayment.totalRepayable')}
          <input
            type="number"
            min={Math.max(previewPrincipal, paidNum)}
            value={total}
            onChange={(e) => {
              setTotal(e.target.value)
              setTotalEdited(true)
            }}
            onWheel={(e) => e.currentTarget.blur()}
            className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <label className="text-xs font-medium text-brand-600">
          {t('admin.repayment.dueDate')}
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={handleSaveTerms} disabled={!termsDirty || savingTerms}>
          {savingTerms ? t('admin.repayment.saving') : t('admin.repayment.saveTerms')}
        </Button>
      </div>
    </div>
  )

  if (['rejected', 'discontinued', 'pending', 'reviewing'].includes(loan.status)) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-4 text-sm text-brand-600">
        {loan.status === 'discontinued'
          ? t('admin.repayment.discontinued')
          : loan.status === 'rejected'
            ? t('admin.repayment.rejected')
            : t('admin.repayment.approveFirst')}
      </div>
    )
  }

  if (loan.status === 'approved') {
    return (
      <div className="mt-5 space-y-4 border-t border-brand-100 pt-5">
        {renderTermsBlock()}
        <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-4 text-sm text-brand-600">
          {t('admin.repayment.lockedUntilDisbursed')}
        </div>
      </div>
    )
  }

  if (loan.status === 'paid') {
    return (
      <div className="mt-5 space-y-4 border-t border-brand-100 pt-5">
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-100">
          <p className="font-semibold">{t('admin.repayment.fullyRepaidTitle')}</p>
          <p className="mt-1">
            {t('admin.repayment.fullyRepaidBody', {
              paid: formatPula(paidNum),
              total: formatPula(loan.total_repayable ?? getEffectivePrincipal(loan)),
            })}
          </p>
        </div>
        {loanPayments.length > 0 && <PaymentHistoryList payments={loanPayments} />}
      </div>
    )
  }

  return (
    <div className="mt-5 space-y-4 border-t border-brand-100 pt-5">
      {loan.status === 'disbursed' && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs text-brand-800">
          {t('admin.repayment.recordHint')}
        </div>
      )}
      {renderTermsBlock()}

      {totalNum != null && (
        <div className="rounded-2xl bg-emerald-50/60 p-4 ring-1 ring-emerald-100">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                {t('dashboard.outstanding')}
              </p>
              <p className="text-2xl font-bold text-emerald-900">{formatPula(balance ?? 0)}</p>
            </div>
            <div className="text-right text-sm text-emerald-800">
              <p>
                {t('admin.repayment.disbursedOfRequested', {
                  disbursed: formatPula(getEffectivePrincipal(loan)),
                  requested: formatPula(requestedAmount),
                })}
              </p>
              <p>
                {t('admin.repayment.paidOf', {
                  paid: formatPula(paidNum),
                  total: formatPula(totalNum),
                })}
              </p>
              {due && (
                <p className="mt-0.5 text-xs text-emerald-600">
                  {t('admin.repayment.dueOn', { date: formatDueDate(due) })}
                </p>
              )}
              {loan.interest_rate === 0 && (
                <p className="mt-0.5 text-xs text-emerald-600">{t('admin.repayment.zeroInterestApplied')}</p>
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
            {t('admin.repayment.recordPayment')}
          </p>
          {loan.total_repayable == null ? (
            <p className="text-sm text-amber-700">{t('admin.repayment.saveTermsFirst')}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="number"
                min="0"
                max={balance ?? undefined}
                step="0.01"
                placeholder={t('admin.repayment.amountPlaceholder')}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                className="rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <input
                type="text"
                maxLength={500}
                placeholder={t('admin.repayment.notesPlaceholder')}
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
                {recording ? t('admin.repayment.recording') : t('admin.repayment.record')}
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
  const { t } = useLanguage()
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-800">
        <History className="h-4 w-4 text-brand-500" />
        {t('dashboard.paymentHistory')}
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
              {(p.interest_rate_snapshot != null || p.total_repayable_snapshot != null) && (
                <p className="text-[11px] text-brand-500">
                  {t('dashboard.termsAtPayment')}{' '}
                  {p.interest_rate_snapshot != null
                    ? t('dashboard.interest', { rate: p.interest_rate_snapshot })
                    : t('dashboard.interestNa')}
                  {p.total_repayable_snapshot != null
                    ? ` · ${t('dashboard.total', { amount: formatPula(p.total_repayable_snapshot) })}`
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
  )
}
