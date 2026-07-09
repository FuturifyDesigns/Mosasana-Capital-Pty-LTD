import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Phone,
  MapPin,
  IdCard,
  CalendarClock,
  ChevronDown,
  Ban,
  Trash2,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { RepaymentEditor } from '@/components/admin/RepaymentEditor'
import { AdminWorkflowStepper } from '@/components/admin/AdminWorkflowStepper'
import { DisbursementDetails } from '@/components/admin/DisbursementDetails'
import { formatPula } from '@/lib/format'
import { getRepaymentReminder } from '@/lib/loans'
import { useLanguage } from '@/context/LanguageContext'
import type { TranslationKey } from '@/lib/i18n'
import {
  canAdminChangeStatus,
  canMarkDisbursed,
  getAdminNextStepHintKey,
  getAdminStatusOptions,
  getAdminStatusPanelTitleKey,
  getLoanStatusLabelKey,
  isClosedLoanStatus,
} from '@/lib/loanStatus'
import type { LoanPayment, LoanRequest } from '@/lib/supabase'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

interface ReminderLogRow {
  loan_id: string
  kind: string
  created_at: string
}

interface LoanRequestCardProps {
  loan: LoanRequest
  isReturningBorrower?: boolean
  payments: LoanPayment[]
  remindersByLoan: Map<string, ReminderLogRow[]>
  idDocUrl?: string
  expanded: boolean
  onToggle: () => void
  onPreviewDoc: (name: string, url: string) => void
  onStatusChange: (id: string, status: string) => void
  onSaveTerms: (
    id: string,
    fields: {
      total_repayable: number | null
      due_date: string | null
      interest_rate: number | null
    },
  ) => void | Promise<void>
  onPaymentRecorded: () => void
  onDiscontinue: (loan: LoanRequest) => void
  onDelete: (loan: LoanRequest) => void
}

export function LoanRequestCard({
  loan,
  isReturningBorrower = false,
  payments,
  remindersByLoan,
  idDocUrl,
  expanded,
  onToggle,
  onPreviewDoc,
  onStatusChange,
  onSaveTerms,
  onPaymentRecorded,
  onDiscontinue,
  onDelete,
}: LoanRequestCardProps) {
  const { t } = useLanguage()
  const canDiscontinue = !isClosedLoanStatus(loan.status)
  const canDelete = ['pending', 'reviewing'].includes(loan.status)

  const reminder = getRepaymentReminder(loan)
  const sent = remindersByLoan.get(loan.id) ?? []

  const reminderKindKeys: Record<string, TranslationKey> = {
    'd-7': 'admin.reminder.d7',
    'd-3': 'admin.reminder.d3',
    'd-1': 'admin.reminder.d1',
    'd-0': 'admin.reminder.d0',
    overdue: 'admin.reminder.overdue',
  }
  const reminderKindLabel = (kind: string) => {
    const key = reminderKindKeys[kind]
    return key ? t(key) : kind
  }

  return (
    <Card className="overflow-hidden !p-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-4 text-left text-white transition hover:from-brand-700 hover:to-brand-600 sm:px-5"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold">{loan.full_name}</p>
            {isReturningBorrower && (
              <span className="rounded-full bg-emerald-200/90 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
                {t('admin.returningBorrower')}
              </span>
            )}
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
              {t(getLoanStatusLabelKey(loan.status))}
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium capitalize">
              {loan.source}
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {formatPula(loan.loan_amount)}
          </p>
          <p className="mt-0.5 text-sm text-brand-100">{loan.loan_purpose}</p>
          {!expanded && (
            <p className="mt-2 text-xs text-brand-100/90">
              {loan.email} · {new Date(loan.created_at).toLocaleString()} ·{' '}
              {t(expanded ? 'admin.loan.tapToCollapse' : 'admin.loan.tapToOpen')}
            </p>
          )}
        </div>
        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 transition ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-brand-100 p-4 sm:p-5">
              <AdminWorkflowStepper loan={loan} />
              <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-600">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-brand-400" />
                      {loan.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-brand-400" />
                      {loan.phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IdCard className="h-3.5 w-3.5 text-brand-400" />
                      {loan.id_type === 'passport' ? 'Passport' : 'ID'}: {loan.id_number}
                    </span>
                  </div>
                  <p className="flex items-start gap-1.5 text-sm text-brand-600">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
                    {loan.physical_address}
                  </p>
                  <p className="text-xs text-brand-500">
                    {cap(loan.employment_status)}
                    {loan.term_months ? ` · ${loan.term_months}-month term` : ''}
                    {loan.monthly_income ? ` · Income: ${formatPula(loan.monthly_income)}` : ''}
                    {' · '}
                    {new Date(loan.created_at).toLocaleString()}
                  </p>
                  {reminder && reminder.level !== 'ok' && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        reminder.level === 'soon'
                          ? 'bg-yellow-50 text-yellow-800'
                          : reminder.level === 'due'
                            ? 'bg-orange-50 text-orange-800'
                            : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      {reminder.message}
                    </span>
                  )}
                  {sent.length > 0 && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600"
                      title={sent.map((r) => reminderKindLabel(r.kind)).join(', ')}
                    >
                      <Mail className="h-3.5 w-3.5 text-brand-400" />
                      {sent.length === 1
                        ? t('admin.loan.remindersSent', { count: sent.length })
                        : t('admin.loan.remindersSentPlural', { count: sent.length })}
                    </span>
                  )}
                  {idDocUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        onPreviewDoc(
                          `${loan.full_name} — ${loan.id_type === 'passport' ? 'Passport' : 'ID'} document`,
                          idDocUrl,
                        )
                      }
                      className="mt-2 overflow-hidden rounded-xl border border-brand-200 bg-white text-left transition hover:border-brand-400"
                      title={t('admin.loan.enlargeId')}
                    >
                      <img
                        src={idDocUrl}
                        alt={`${loan.full_name} ID document`}
                        className="h-32 w-52 object-cover"
                        loading="lazy"
                      />
                      <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-brand-700">
                        <IdCard className="h-3.5 w-3.5" />
                        {t('admin.loan.enlargeId')}
                      </div>
                    </button>
                  )}
                  <DisbursementDetails
                    disbursementType={loan.disbursement_type}
                    bankName={loan.bank_name}
                    bankAccountName={loan.bank_account_name}
                    bankAccountNumber={loan.bank_account_number}
                    bankBranchCode={loan.bank_branch_code}
                    bankBranchName={loan.bank_branch_name}
                  />
                </div>

                <div className="w-full shrink-0 space-y-3 sm:w-52">
                  {canAdminChangeStatus(loan) ? (
                    <>
                      <Select
                        label={t(getAdminStatusPanelTitleKey(loan))}
                        hidePlaceholder
                        options={getAdminStatusOptions(loan).map((option) => ({
                          value: option.value,
                          label: t(option.labelKey),
                        }))}
                        value={loan.status}
                        onChange={(e) => onStatusChange(loan.id, e.target.value)}
                        hint={
                          loan.status === 'approved' && !canMarkDisbursed(loan)
                            ? t('admin.statusHint.disburseLocked')
                            : undefined
                        }
                      />
                      <div className="rounded-xl border border-brand-100 bg-brand-50/80 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-500">
                          {t('admin.nextStep')}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-brand-700">
                          {t(getAdminNextStepHintKey(loan))}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-brand-100 bg-brand-50/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                        {t(getAdminStatusPanelTitleKey(loan))}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-brand-900">
                        {t(getLoanStatusLabelKey(loan.status))}
                      </p>
                      <div className="mt-3 rounded-lg border border-brand-100 bg-white/80 p-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-500">
                          {t('admin.nextStep')}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-brand-700">
                          {t(getAdminNextStepHintKey(loan))}
                        </p>
                      </div>
                    </div>
                  )}

                  {(canDiscontinue || canDelete) && (
                    <div className="flex flex-col gap-2 border-t border-brand-100 pt-3">
                      {canDiscontinue && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-orange-200 text-orange-800 hover:bg-orange-50"
                          onClick={() => onDiscontinue(loan)}
                        >
                          <Ban className="h-4 w-4" />
                          {t('admin.loan.discontinue')}
                        </Button>
                      )}
                      {canDelete && !['paid', 'disbursed'].includes(loan.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => onDelete(loan)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('admin.loan.delete')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <RepaymentEditor
                loan={loan}
                payments={payments}
                onSaveTerms={onSaveTerms}
                onPaymentRecorded={onPaymentRecorded}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
