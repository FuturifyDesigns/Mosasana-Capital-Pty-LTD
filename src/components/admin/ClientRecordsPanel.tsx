import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Archive,
  ChevronDown,
  Mail,
  Phone,
  IdCard,
  MapPin,
  Calendar,
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
import type { AdminUser, LoanRequest } from '@/lib/supabase'

const FILTER_OPTIONS: { value: ClientRecordsFilter; label: string }[] = [
  { value: 'all', label: 'All clients' },
  { value: 'funded', label: 'Funded (disbursed/paid)' },
  { value: 'active', label: 'Active borrowers' },
  { value: 'settled', label: 'Fully settled' },
  { value: 'rejected', label: 'Never funded' },
]

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

interface ClientRecordsPanelProps {
  loans: LoanRequest[]
  users: AdminUser[]
  query: string
}

export function ClientRecordsPanel({ loans, users, query }: ClientRecordsPanelProps) {
  const [recordsFilter, setRecordsFilter] = useState<ClientRecordsFilter>('funded')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

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
          Organised client history — expand any row to see their full loan record.
        </p>
        <div className="w-full sm:w-52">
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
            onToggle={() =>
              setExpandedKey((prev) => (prev === record.key ? null : record.key))
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
  onToggle,
}: {
  record: ClientRecord
  index: number
  expanded: boolean
  onToggle: () => void
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

                <div className="overflow-x-auto rounded-xl border border-brand-100 bg-white">
                  <table className="min-w-[640px] w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-brand-100 bg-brand-50/80 text-xs uppercase tracking-wide text-brand-500">
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Amount</th>
                        <th className="px-4 py-3 font-semibold">Purpose</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Total due</th>
                        <th className="px-4 py-3 font-semibold">Paid</th>
                        <th className="px-4 py-3 font-semibold">Balance</th>
                        <th className="px-4 py-3 font-semibold">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.loans.map((loan) => {
                        const paid = toNumber(loan.amount_paid)
                        const total = loan.total_repayable != null ? toNumber(loan.total_repayable) : null
                        const balance =
                          loan.status === 'paid'
                            ? 0
                            : total != null
                              ? Math.max(total - paid, 0)
                              : null

                        return (
                          <tr key={loan.id} className="border-b border-brand-50 last:border-0">
                            <td className="px-4 py-3 text-brand-700">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-brand-400" />
                                {new Date(loan.created_at).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-brand-900">
                              {formatPula(loan.loan_amount)}
                            </td>
                            <td className="px-4 py-3 text-brand-600">{loan.loan_purpose}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass(loan.status)}`}
                              >
                                {cap(loan.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-brand-700">
                              {total != null ? formatPula(total) : '—'}
                            </td>
                            <td className="px-4 py-3 text-brand-700">{formatPula(paid)}</td>
                            <td className="px-4 py-3 font-medium text-brand-900">
                              {balance != null ? formatPula(balance) : '—'}
                            </td>
                            <td className="px-4 py-3 text-brand-600">
                              {loan.due_date
                                ? new Date(loan.due_date).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
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
