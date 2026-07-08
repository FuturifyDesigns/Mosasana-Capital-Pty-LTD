import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  MessageSquare,
  RefreshCw,
  Search,
  Clock,
  CheckCircle2,
  Inbox,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Wallet,
  Users,
  Ban,
  Trash2,
  ShieldCheck,
  CalendarClock,
  X,
} from 'lucide-react'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { supabase, type LoanRequest, type ContactEnquiry, type AdminUser, type LoanPayment } from '@/lib/supabase'
import { LOAN_STATUSES, ENQUIRY_STATUSES } from '@/lib/constants'
import { getRepaymentReminder } from '@/lib/loans'
import { formatPula } from '@/lib/format'
import {
  canAdminChangeStatus,
  getAdminStatusOptions,
  isLoanLocked,
  LOAN_STATUS_META,
  validateStatusChange,
} from '@/lib/loanStatus'
import { RepaymentEditor } from '@/components/admin/RepaymentEditor'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'

type Tab = 'loans' | 'enquiries' | 'users'

interface ReminderLogRow {
  loan_id: string
  kind: string
  created_at: string
}

const reminderKindLabel: Record<string, string> = {
  'd-7': '7 days before',
  'd-3': '3 days before',
  'd-1': '1 day before',
  'd-0': 'due date',
  overdue: 'overdue',
}

const enquiryBadge: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  read: 'bg-brand-100 text-brand-700',
  responded: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function AdminPage() {
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [tab, setTab] = useState<Tab>('loans')
  const [loans, setLoans] = useState<LoanRequest[]>([])
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [payments, setPayments] = useState<LoanPayment[]>([])
  const [reminderLog, setReminderLog] = useState<ReminderLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [idDocUrls, setIdDocUrls] = useState<Record<string, string>>({})
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null)

  const fetchData = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true)
    const [loansRes, enquiriesRes, usersRes, remindersRes, paymentsRes] = await Promise.all([
      supabase.from('loan_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_enquiries').select('*').order('created_at', { ascending: false }),
      supabase.rpc('admin_list_users'),
      supabase.from('loan_reminder_log').select('loan_id, kind, created_at'),
      supabase.from('loan_payments').select('*').order('created_at', { ascending: false }),
    ])

    const loansData = (loansRes.data as LoanRequest[]) || []
    setLoans(loansData)
    setEnquiries((enquiriesRes.data as ContactEnquiry[]) || [])
    setReminderLog((remindersRes.data as ReminderLogRow[]) || [])
    setPayments((paymentsRes.data as LoanPayment[]) || [])

    const paths = loansData
      .map((l) => l.id_photo_path)
      .filter((p): p is string => Boolean(p))

    if (paths.length > 0) {
      const entries = await Promise.all(
        paths.map(async (p) => {
          const { data } = await supabase.storage.from('id-documents').createSignedUrl(p, 300)
          return [p, data?.signedUrl ?? ''] as const
        }),
      )
      setIdDocUrls(
        Object.fromEntries(entries.filter(([, url]) => url)) as Record<string, string>,
      )
    } else {
      setIdDocUrls({})
    }

    if (usersRes.error) {
      // RPC not deployed yet — fall back to profiles (no emails until SQL is run)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      setUsers(
        ((profiles as AdminUser[]) || []).map((p) => ({
          ...p,
          email: p.email ?? '—',
          loan_count: loansData.filter((l) => l.user_id === p.id).length,
          active_loan_count: loansData.filter(
            (l) => l.user_id === p.id && !['rejected', 'paid'].includes(l.status),
          ).length,
        })),
      )
      if (usersRes.error.code === 'PGRST202') {
        showToast('Run supabase/fix-live-db.sql in Supabase to enable full user management.', 'info')
      }
    } else {
      setUsers((usersRes.data as AdminUser[]) || [])
    }

    if (!options?.silent) setLoading(false)
  }, [showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Live updates without full-page loading flicker
  useEffect(() => {
    const refresh = () => fetchData({ silent: true })
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_requests' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_enquiries' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_reminder_log' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_payments' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, refresh)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData])

  const banUser = async (u: AdminUser) => {
    const next = !u.banned
    if (next) {
      const ok = await confirm({
        title: 'Ban user?',
        message: `Ban ${u.full_name || u.email}? They won't be able to sign in until you unban them.`,
        confirmLabel: 'Ban user',
        cancelLabel: 'Cancel',
        tone: 'danger',
        icon: Ban,
      })
      if (!ok) return
    }
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, banned: next } : x)))
    const { error } = await supabase.rpc('admin_set_ban', { target: u.id, ban: next })
    if (error) {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, banned: !next } : x)))
      showToast(error.message || 'Could not update user.', 'error')
    } else {
      showToast(next ? 'User banned.' : 'User unbanned.', 'success')
    }
  }

  const deleteUser = async (u: AdminUser) => {
    const ok = await confirm({
      title: 'Delete user permanently?',
      message: `Permanently delete ${u.full_name || u.email}? This removes their account and cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      tone: 'danger',
    })
    if (!ok) return
    const { error } = await supabase.rpc('admin_delete_user', { target: u.id })
    if (error) {
      showToast(error.message || 'Could not delete user.', 'error')
    } else {
      setUsers((prev) => prev.filter((x) => x.id !== u.id))
      showToast('User deleted.', 'success')
    }
  }

  const updateLoanStatus = async (id: string, status: string) => {
    const loan = loans.find((l) => l.id === id)
    if (!loan) return

    const validationError = validateStatusChange(loan, status)
    if (validationError) {
      showToast(validationError, 'error')
      return
    }

    const previousStatus = loan.status
    setLoans((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
    const { data, error } = await supabase
      .from('loan_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      setLoans((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: previousStatus } : l)),
      )
      showToast(error.message || 'Could not update loan status.', 'error')
      return
    }

    if (data) setLoans((prev) => prev.map((l) => (l.id === id ? (data as LoanRequest) : l)))
    showToast(`Loan status updated to ${cap(status)}.`, 'success')
  }

  const saveRepaymentTerms = async (
    id: string,
    fields: {
      total_repayable: number | null
      due_date: string | null
      interest_rate: number | null
    },
  ) => {
    const loan = loans.find((l) => l.id === id)
    if (loan && isLoanLocked(loan)) {
      showToast('Paid and rejected loans are locked.', 'error')
      return
    }

    const { data, error } = await supabase
      .from('loan_requests')
      .update(fields)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      showToast(error.message || 'Could not save repayment terms.', 'error')
      return
    }

    if (data) setLoans((prev) => prev.map((l) => (l.id === id ? (data as LoanRequest) : l)))
  }

  const updateEnquiryStatus = async (id: string, status: string) => {
    const previous = enquiries.find((e) => e.id === id)?.status
    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
    const { error } = await supabase.from('contact_enquiries').update({ status }).eq('id', id)
    if (error && previous) {
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status: previous } : e)))
      showToast(error.message || 'Could not update enquiry.', 'error')
    }
  }

  const stats = useMemo(
    () => ({
      totalLoans: loans.length,
      pending: loans.filter((l) => l.status === 'pending').length,
      approved: loans.filter((l) => l.status === 'approved').length,
      disbursed: loans.filter((l) => l.status === 'disbursed').length,
      paid: loans.filter((l) => l.status === 'paid').length,
      newEnquiries: enquiries.filter((e) => e.status === 'new').length,
      totalUsers: users.length,
    }),
    [loans, enquiries, users],
  )

  const filteredLoans = useMemo(() => {
    const q = query.trim().toLowerCase()
    return loans.filter((l) => {
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter
      const matchesQuery =
        !q ||
        l.full_name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.id_number.includes(q)
      return matchesStatus && matchesQuery
    })
  }, [loans, query, statusFilter])

  const filteredEnquiries = useMemo(() => {
    const q = query.trim().toLowerCase()
    return enquiries.filter((e) => {
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter
      const matchesQuery =
        !q ||
        e.full_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [enquiries, query, statusFilter])

  const remindersByLoan = useMemo(() => {
    const map = new Map<string, ReminderLogRow[]>()
    for (const r of reminderLog) {
      const list = map.get(r.loan_id) ?? []
      list.push(r)
      map.set(r.loan_id, list)
    }
    return map
  }, [reminderLog])

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter(
      (u) =>
        !q ||
        (u.full_name || '').toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || '').includes(q),
    )
  }, [users, query])

  const statusOptions =
    tab === 'loans'
      ? [{ value: 'all', label: 'All statuses' }, ...LOAN_STATUSES.map((s) => ({ value: s, label: cap(s) }))]
      : [{ value: 'all', label: 'All statuses' }, ...ENQUIRY_STATUSES.map((s) => ({ value: s, label: cap(s) }))]

  const switchTab = (t: Tab) => {
    setTab(t)
    setStatusFilter('all')
    setQuery('')
  }

  return (
    <>
      <PageHero title="Admin Portal" subtitle="Manage loans, repayments, enquiries, and users." />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={FileText} label="Total loans" value={stats.totalLoans} tone="brand" />
          <StatCard icon={Clock} label="Pending" value={stats.pending} tone="yellow" highlight={stats.pending > 0} />
          <StatCard icon={CheckCircle2} label="Approved" value={stats.approved} tone="green" />
          <StatCard icon={Wallet} label="Settled" value={stats.paid} tone="emerald" />
          <StatCard icon={Users} label="Users" value={stats.totalUsers} tone="brand" />
          <StatCard icon={Inbox} label="New enquiries" value={stats.newEnquiries} tone="blue" highlight={stats.newEnquiries > 0} />
        </div>

        {/* Controls */}
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-brand-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => switchTab('loans')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === 'loans' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
              }`}
            >
              <FileText className="h-4 w-4" />
              Loan Requests
              {stats.pending > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{stats.pending}</span>
              )}
            </button>
            <button
              onClick={() => switchTab('enquiries')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === 'enquiries' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Enquiries
              {stats.newEnquiries > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{stats.newEnquiries}</span>
              )}
            </button>
            <button
              onClick={() => switchTab('users')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === 'users' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
              }`}
            >
              <Users className="h-4 w-4" />
              Users
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-3 sm:flex-row lg:max-w-lg lg:justify-end">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  tab === 'loans'
                    ? 'Search name, email, ID…'
                    : tab === 'users'
                      ? 'Search name, email, phone…'
                      : 'Search name, email, subject…'
                }
                className="w-full rounded-xl border border-brand-200 bg-white py-2.5 pl-9 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            {tab !== 'users' && (
              <div className="w-full sm:w-44">
                <Select
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  hidePlaceholder
                  aria-label="Filter by status"
                />
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => fetchData()} className="shrink-0">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-36 rounded-2xl" />
              ))}
            </div>
          ) : tab === 'loans' ? (
            <div className="space-y-4">
              {filteredLoans.length === 0 ? (
                <EmptyState label="No loan requests match your filters." />
              ) : (
                filteredLoans.map((loan, i) => (
                  <motion.div
                    key={loan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  >
                    <Card className="overflow-hidden !p-0">
                      <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-4 text-white">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold">{loan.full_name}</p>
                            <p className="mt-1 text-3xl font-bold tracking-tight">
                              {formatPula(loan.loan_amount)}
                            </p>
                            <p className="mt-0.5 text-sm text-brand-100">{loan.loan_purpose}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                              {cap(loan.status)}
                            </span>
                            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium capitalize">
                              {loan.source}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-600">
                            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-brand-400" />{loan.email}</span>
                            <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-brand-400" />{loan.phone}</span>
                            <span className="flex items-center gap-1.5"><IdCard className="h-3.5 w-3.5 text-brand-400" />{loan.id_type === 'passport' ? 'Passport' : 'ID'}: {loan.id_number}</span>
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
                          {(() => {
                            const reminder = getRepaymentReminder(loan)
                            if (!reminder || reminder.level === 'ok') return null
                            const tones: Record<string, string> = {
                              soon: 'bg-yellow-50 text-yellow-800',
                              due: 'bg-orange-50 text-orange-800',
                              overdue: 'bg-red-50 text-red-700',
                            }
                            return (
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tones[reminder.level]}`}
                              >
                                <CalendarClock className="h-3.5 w-3.5" />
                                {reminder.message}
                              </span>
                            )
                          })()}
                          {(() => {
                            const sent = remindersByLoan.get(loan.id) ?? []
                            if (sent.length === 0) return null
                            const kinds = sent
                              .map((r) => reminderKindLabel[r.kind] ?? r.kind)
                              .join(', ')
                            return (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600"
                                title={`Reminder emails sent: ${kinds}`}
                              >
                                <Mail className="h-3.5 w-3.5 text-brand-400" />
                                {sent.length} reminder{sent.length === 1 ? '' : 's'} sent
                              </span>
                            )
                          })()}
                          {loan.id_photo_path && idDocUrls[loan.id_photo_path] && (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDoc({
                                  name: `${loan.full_name} — ${loan.id_type === 'passport' ? 'Passport' : 'ID'} document`,
                                  url: idDocUrls[loan.id_photo_path!],
                                })
                              }
                              className="mt-2 overflow-hidden rounded-xl border border-brand-200 bg-white text-left transition hover:border-brand-400"
                              title="Click to open larger preview"
                            >
                              <img
                                src={idDocUrls[loan.id_photo_path]}
                                alt={`${loan.full_name} ID document`}
                                className="h-24 w-40 object-cover"
                                loading="lazy"
                              />
                              <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-brand-700">
                                <IdCard className="h-3.5 w-3.5" />
                                Click to enlarge
                              </div>
                            </button>
                          )}
                        </div>
                        <div className="w-44 shrink-0">
                          {canAdminChangeStatus(loan) ? (
                            <>
                              <Select
                                label="Update status"
                                hidePlaceholder
                                options={getAdminStatusOptions(loan)}
                                value={loan.status}
                                onChange={(e) => updateLoanStatus(loan.id, e.target.value)}
                              />
                              <p className="mt-2 text-[11px] leading-snug text-brand-500">
                                {LOAN_STATUS_META[loan.status as keyof typeof LOAN_STATUS_META]?.adminHint}
                              </p>
                            </>
                          ) : (
                            <div className="rounded-xl border border-brand-100 bg-brand-50/80 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                                Status locked
                              </p>
                              <p className="mt-1 text-sm font-semibold capitalize text-brand-900">
                                {loan.status}
                              </p>
                              <p className="mt-1 text-[11px] leading-snug text-brand-500">
                                {LOAN_STATUS_META[loan.status as keyof typeof LOAN_STATUS_META]?.adminHint}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <RepaymentEditor
                        loan={loan}
                        payments={payments}
                        onSaveTerms={saveRepaymentTerms}
                        onPaymentRecorded={() => fetchData({ silent: true })}
                      />
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          ) : tab === 'enquiries' ? (
            <div className="space-y-4">
              {filteredEnquiries.length === 0 ? (
                <EmptyState label="No enquiries match your filters." />
              ) : (
                filteredEnquiries.map((enquiry, i) => (
                  <motion.div
                    key={enquiry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  >
                    <Card>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-semibold text-brand-900">{enquiry.full_name}</p>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${enquiryBadge[enquiry.status] ?? 'bg-brand-100 text-brand-700'}`}>
                              {cap(enquiry.status)}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-600">
                            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-brand-400" />{enquiry.email}</span>
                            {enquiry.phone && (
                              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-brand-400" />{enquiry.phone}</span>
                            )}
                          </div>
                          <p className="mt-2 font-semibold text-brand-800">{enquiry.subject}</p>
                          <p className="mt-1 max-w-2xl text-sm text-brand-600">{enquiry.message}</p>
                          <p className="mt-2 text-xs text-brand-500">
                            {new Date(enquiry.created_at).toLocaleString()}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <a href={`mailto:${enquiry.email}?subject=RE: ${encodeURIComponent(enquiry.subject)}`}>
                              <Button variant="outline" size="sm">
                                <Mail className="h-4 w-4" /> Reply by email
                              </Button>
                            </a>
                          </div>
                        </div>
                        <div className="w-44 shrink-0">
                          <Select
                            label="Update status"
                            hidePlaceholder
                            options={ENQUIRY_STATUSES.map((s) => ({ value: s, label: cap(s) }))}
                            value={enquiry.status}
                            onChange={(e) => updateEnquiryStatus(enquiry.id, e.target.value)}
                          />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.length === 0 ? (
                <EmptyState label="No users found." />
              ) : (
                filteredUsers.map((u, i) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  >
                    <Card>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-semibold text-brand-900">
                              {u.full_name || '(no name)'}
                            </p>
                            {u.role === 'admin' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                                <ShieldCheck className="h-3.5 w-3.5" /> Admin
                              </span>
                            )}
                            {u.banned && (
                              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                                Banned
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-600">
                            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-brand-400" />{u.email}</span>
                            {u.phone && (
                              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-brand-400" />{u.phone}</span>
                            )}
                          </div>
                          <p className="text-xs text-brand-500">
                            {u.loan_count} loan{u.loan_count === 1 ? '' : 's'}
                            {u.active_loan_count > 0 ? ` · ${u.active_loan_count} active` : ''}
                            {' · Joined '}
                            {new Date(u.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {u.role !== 'admin' && (
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => banUser(u)}
                            >
                              <Ban className="h-4 w-4" /> {u.banned ? 'Unban' : 'Ban'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteUser(u)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </section>
      {previewDoc && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-brand-100 px-4 py-3">
              <p className="text-sm font-semibold text-brand-900">{previewDoc.name}</p>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-lg p-1.5 text-brand-600 transition hover:bg-brand-50"
                aria-label="Close document preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-brand-50 p-3">
              <img
                src={previewDoc.url}
                alt={previewDoc.name}
                className="max-h-[75vh] w-full rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const toneClasses: Record<string, string> = {
  brand: 'bg-brand-100 text-brand-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  highlight,
}: {
  icon: typeof FileText
  label: string
  value: number
  tone: keyof typeof toneClasses
  highlight?: boolean
}) {
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm transition ${highlight ? 'border-amber-200 ring-2 ring-amber-100' : 'border-brand-100'}`}>
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-brand-900">{value}</p>
      <p className="text-xs font-medium text-brand-500">{label}</p>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-white/60 py-16 text-center">
      <Inbox className="h-10 w-10 text-brand-300" />
      <p className="mt-3 text-brand-600">{label}</p>
    </div>
  )
}
