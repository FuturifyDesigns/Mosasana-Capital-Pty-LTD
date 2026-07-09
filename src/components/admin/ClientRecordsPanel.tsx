import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Archive,
  ChevronDown,
  Mail,
  Phone,
  IdCard,
  MapPin,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { formatPula, toNumber } from '@/lib/format'
import {
  buildClientRecords,
  filterClientRecords,
  type ClientRecordsFilter,
  type ClientRecord,
} from '@/lib/clientRecords'
import { statusBadgeClass } from '@/lib/loanStatus'
import { DisbursementDetails } from '@/components/admin/DisbursementDetails'
import type { AdminUser, LoanRequest } from '@/lib/supabase'

const FILTER_OPTIONS: { value: ClientRecordsFilter; label: string }[] = [
  { value: 'all', label: 'All clients' },
  { value: 'funded', label: 'Funded clients' },
  { value: 'active', label: 'Active borrowers' },
  { value: 'settled', label: 'Fully settled' },
  { value: 'rejected', label: 'Never funded' },
]

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

interface ClientRecordsPanelProps {
  loans: LoanRequest[]
  users: AdminUser[]
  query: string
  idDocUrls: Record<string, string>
  onPreviewDoc: (name: string, url: string) => void
}

export function ClientRecordsPanel({
  loans,
  users,
  query,
  idDocUrls,
  onPreviewDoc,
}: ClientRecordsPanelProps) {
  const [recordsFilter, setRecordsFilter] = useState<ClientRecordsFilter>('funded')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null)

  const records = useMemo(() => {
    const built = buildClientRecords(loans, users)
    const filtered = filterClientRecords(built, recordsFilter)
    const q = query.trim().toLowerCase()
    if (!q) return filtered
    return filtered.filter(
      (r) =>
        r.displayName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.idNumber.toLowerCase().includes(q),
    )
  }, [loans, users, recordsFilter, query])

  const summary = useMemo(
    () => ({
      clients: records.length,
      totalLoans: records.reduce((n, r) => n + r.loanCount, 0),
      totalRepaid: records.reduce((n, r) => n + r.totalRepaid, 0),
      outstanding: records.reduce((n, r) => n + r.totalOutstanding, 0),
    }),
    [records],
  )

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-white/60 py-16 text-center">
        <Archive className="h-10 w-10 text-brand-300" />
        <p className="mt-3 text-brand-600">No client records match your filters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryTile label="Clients" value={String(summary.clients)} />
        <SummaryTile label="Total loans" value={String(summary.totalLoans)} />
        <SummaryTile label="Total repaid" value={formatPula(summary.totalRepaid)} />
        <SummaryTile label="Outstanding" value={formatPula(summary.outstanding)} accent />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-brand-600">
          Client file history — expand a client, then each loan for full details and ID documents.
        </p>
        <div className="w-full sm:w-72">
          <Select
            options={FILTER_OPTIONS}
            value={recordsFilter}
            onChange={(e) => setRecordsFilter(e.target.value as ClientRecordsFilter)}
            hidePlaceholder
            aria-label="Filter client records"
          />
        </div>
      </div>

      <div className="space-y-3">
        {records.map((record, i) => (
          <ClientRecordCard
            key={record.key}
            record={record}
            index={i}
            expanded={expandedKey === record.key}
            expandedLoanId={expandedKey === record.key ? expandedLoanId : null}
            idDocUrls={idDocUrls}
            onPreviewDoc={onPreviewDoc}
            onToggle={() => {
              setExpandedKey((prev) => {
                if (prev === record.key) {
                  setExpandedLoanId(null)
                  return null
                }
                setExpandedLoanId(null)
                return record.key
              })
            }}
            onToggleLoan={(loanId) =>
              setExpandedLoanId((prev) => (prev === loanId ? null : loanId))
            }
          />
        ))}
      </div>
    </div>
  )
}

function SummaryTile({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${accent ? 'border-emerald-200 bg-emerald-50/80' : 'border-brand-100 bg-white'}`}
    >
      <p className="text-xs font-medium text-brand-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent ? 'text-emerald-800' : 'text-brand-900'}`}>
        {value}
      </p>
    </div>
  )
}

function ClientRecordCard({
  record,
  index,
  expanded,
  expandedLoanId,
  idDocUrls,
  onPreviewDoc,
  onToggle,
  onToggleLoan,
}: {
  record: ClientRecord
  index: number
  expanded: boolean
  expandedLoanId: string | null
  idDocUrls: Record<string, string>
  onPreviewDoc: (name: string, url: string) => void
  onToggle: () => void
  onToggleLoan: (loanId: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.2) }}
    >
      <Card className="overflow-hidden !p-0">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start gap-4 p-4 text-left transition hover:bg-brand-50/50 sm:p-5"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <span className="text-sm font-bold">
              {record.displayName
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase()}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold text-brand-900">{record.displayName}</p>
              {record.activeCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  {record.activeCount} active
                </span>
              )}
              {record.paidCount > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  {record.paidCount} settled
                </span>
              )}
              {record.loanCount > 1 && record.paidCount > 0 && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  Returning borrower
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-600">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-brand-400" />
                {record.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-brand-400" />
                {record.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <IdCard className="h-3.5 w-3.5 text-brand-400" />
                {record.idNumber}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric label="Loans" value={String(record.loanCount)} icon={Archive} />
              <Metric label="Borrowed" value={formatPula(record.totalPrincipal)} icon={TrendingUp} />
              <Metric label="Repaid" value={formatPula(record.totalRepaid)} icon={Wallet} />
              <Metric
                label="Outstanding"
                value={formatPula(record.totalOutstanding)}
                icon={Wallet}
                highlight={record.totalOutstanding > 0}
              />
            </div>

            <p className="mt-2 text-xs text-brand-500">
              Client since {new Date(record.firstLoanAt).toLocaleDateString('en-GB')} · Last activity{' '}
              {new Date(record.lastLoanAt).toLocaleDateString('en-GB')}
            </p>
          </div>

          <ChevronDown
            className={`mt-1 h-5 w-5 shrink-0 text-brand-400 transition ${expanded ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-brand-100"
            >
              <div className="space-y-4 bg-brand-50/40 p-4 sm:p-5">
                <p className="flex items-start gap-1.5 text-sm text-brand-600">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
                  {record.address}
                </p>

                <DisbursementDetails
                  disbursementType={record.disbursementType}
                  bankName={record.bankName}
                  bankAccountName={record.bankAccountName}
                  bankAccountNumber={record.bankAccountNumber}
                  bankBranchCode={record.bankBranchCode}
                  bankBranchName={record.bankBranchName}
                />

                <LoanFileGroup
                  title="Active Loans"
                  loans={record.loans.filter((loan) => !['paid', 'rejected', 'discontinued'].includes(loan.status))}
                  expandedLoanId={expandedLoanId}
                  onToggleLoan={onToggleLoan}
                  idDocUrls={idDocUrls}
                  onPreviewDoc={onPreviewDoc}
                />
                <LoanFileGroup
                  title="Loan History"
                  loans={record.loans.filter((loan) => ['paid', 'rejected', 'discontinued'].includes(loan.status))}
                  expandedLoanId={expandedLoanId}
                  onToggleLoan={onToggleLoan}
                  idDocUrls={idDocUrls}
                  onPreviewDoc={onPreviewDoc}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

function LoanFileGroup({
  title,
  loans,
  expandedLoanId,
  onToggleLoan,
  idDocUrls,
  onPreviewDoc,
}: {
  title: string
  loans: LoanRequest[]
  expandedLoanId: string | null
  onToggleLoan: (loanId: string) => void
  idDocUrls: Record<string, string>
  onPreviewDoc: (name: string, url: string) => void
}) {
  if (loans.length === 0) return null
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{title}</p>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-brand-600 ring-1 ring-brand-100">
          {loans.length}
        </span>
      </div>
      {loans.map((loan) => {
                    const loanExpanded = expandedLoanId === loan.id
                    const idUrl = loan.id_photo_path ? idDocUrls[loan.id_photo_path] : undefined
                    const paid = toNumber(loan.amount_paid)
                    const total =
                      loan.total_repayable != null ? toNumber(loan.total_repayable) : null
                    const balance =
                      loan.status === 'paid'
                        ? 0
                        : total != null
                          ? Math.max(total - paid, 0)
                          : null

                    return (
                      <div
                        key={loan.id}
                        className="overflow-hidden rounded-xl border border-brand-100 bg-white"
                      >
                        <button
                          type="button"
                          onClick={() => onToggleLoan(loan.id)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-brand-50/80"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-brand-900">
                                {formatPula(loan.loan_amount)} · {loan.loan_purpose}
                              </p>
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass(loan.status)}`}
                              >
                                {cap(loan.status)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-brand-500">
                              {new Date(loan.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                              {loan.due_date
                                ? ` · Due ${new Date(loan.due_date).toLocaleDateString('en-GB')}`
                                : ''}
                            </p>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-brand-400 transition ${loanExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {loanExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-brand-100"
                            >
                              <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto]">
                                <div className="space-y-2 text-sm text-brand-700">
                                  <p>
                                    <strong>Email:</strong> {loan.email}
                                  </p>
                                  <p>
                                    <strong>Phone:</strong> {loan.phone}
                                  </p>
                                  <p>
                                    <strong>{loan.id_type === 'passport' ? 'Passport' : 'ID'}:</strong>{' '}
                                    {loan.id_number}
                                  </p>
                                  <p>
                                    <strong>Address:</strong> {loan.physical_address}
                                  </p>
                                  <p>
                                    <strong>Employment:</strong> {cap(loan.employment_status)}
                                    {loan.term_months ? ` · ${loan.term_months} months` : ''}
                                    {loan.monthly_income
                                      ? ` · Income ${formatPula(loan.monthly_income)}`
                                      : ''}
                                  </p>
                                  <DisbursementDetails
                                    disbursementType={loan.disbursement_type}
                                    bankName={loan.bank_name}
                                    bankAccountName={loan.bank_account_name}
                                    bankAccountNumber={loan.bank_account_number}
                                    bankBranchCode={loan.bank_branch_code}
                                    bankBranchName={loan.bank_branch_name}
                                  />
                                  <p>
                                    <strong>Total due:</strong>{' '}
                                    {total != null ? formatPula(total) : '—'} ·{' '}
                                    <strong>Paid:</strong> {formatPula(paid)} ·{' '}
                                    <strong>Balance:</strong>{' '}
                                    {balance != null ? formatPula(balance) : '—'}
                                  </p>
                                </div>

                                {idUrl && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onPreviewDoc(
                                        `${loan.full_name} — ${loan.id_type === 'passport' ? 'Passport' : 'ID'}`,
                                        idUrl,
                                      )
                                    }
                                    className="shrink-0 overflow-hidden rounded-xl border border-brand-200 text-left transition hover:border-brand-400"
                                  >
                                    <img
                                      src={idUrl}
                                      alt={`${loan.full_name} ID`}
                                      className="h-36 w-56 object-cover"
                                      loading="lazy"
                                    />
                                    <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-brand-700">
                                      <IdCard className="h-3.5 w-3.5" />
                                      View ID document
                                    </div>
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
      })}
    </div>
  )
}

function Metric({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string
  value: string
  icon: typeof Archive
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg px-2.5 py-2 ${highlight ? 'bg-amber-50 ring-1 ring-amber-100' : 'bg-white ring-1 ring-brand-100'}`}
    >
      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-brand-500">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-bold ${highlight ? 'text-amber-900' : 'text-brand-900'}`}>
        {value}
      </p>
    </div>
  )
}
