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
} from 'lucide-react'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { supabase, type LoanRequest, type ContactEnquiry, type AdminUser } from '@/lib/supabase'
import { LOAN_STATUSES, ENQUIRY_STATUSES } from '@/lib/constants'
import { getRepaymentReminder } from '@/lib/loans'
import { useToast } from '@/context/ToastContext'

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

const loanBadge: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
  disbursed: 'bg-brand-100 text-brand-800',
  paid: 'bg-emerald-100 text-emerald-800',
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
  const [tab, setTab] = useState<Tab>('loans')
  const [loans, setLoans] = useState<LoanRequest[]>([])
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [reminderLog, setReminderLog] = useState<ReminderLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [loansRes, enquiriesRes, usersRes, remindersRes] = await Promise.all([
      supabase.from('loan_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_enquiries').select('*').order('created_at', { ascending: false }),
      supabase.rpc('admin_list_users'),
      supabase.from('loan_reminder_log').select('loan_id, kind, created_at'),
    ])

    const loansData = (loansRes.data as LoanRequest[]) || []
    setLoans(loansData)
    setEnquiries((enquiriesRes.data as ContactEnquiry[]) || [])
    setReminderLog((remindersRes.data as ReminderLogRow[]) || [])

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

    setLoading(false)
  }, [showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Live updates: refetch whenever loans, enquiries or profiles change.
  useEffect(() => {
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_requests' }, () =>
        fetchData(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_enquiries' }, () =>
        fetchData(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_reminder_log' }, () =>
        fetchData(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData])

  const banUser = async (u: AdminUser) => {
    const next = !u.banned
    if (next && !window.confirm(`Ban ${u.full_name || u.email}? They won't be able to sign in.`)) return
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
    if (
      !window.confirm(
        `Permanently delete ${u.full_name || u.email}? This removes their account and cannot be undone.`,
      )
    )
      return
    const { error } = await supabase.rpc('admin_delete_user', { target: u.id })
    if (error) {
      showToast(error.message || 'Could not delete user.', 'error')
    } else {
      setUsers((prev) => prev.filter((x) => x.id !== u.id))
      showToast('User deleted.', 'success')
    }
  }

  const updateLoanStatus = async (id: string, status: string) => {
    setLoans((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
    const { data } = await supabase
      .from('loan_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (data) setLoans((prev) => prev.map((l) => (l.id === id ? (data as LoanRequest) : l)))
  }

  const saveRepayment = async (
    id: string,
    fields: { total_repayable: number | null; amount_paid: number | null; due_date: string | null },
  ) => {
    const { data } = await supabase
      .from('loan_requests')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (data) setLoans((prev) => prev.map((l) => (l.id === id ? (data as LoanRequest) : l)))
  }

  const updateEnquiryStatus = async (id: string, status: string) => {
    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
    await supabase.from('contact_enquiries').update({ status }).eq('id', id)
  }

  const viewIdDocument = async (path: string) => {
    const { data } = await supabase.storage.from('id-documents').createSignedUrl(path, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
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
      <PageHero title="Admin Portal" subtitle="Manage loan applications and contact enquiries." />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={FileText} label="Total loans" value={stats.totalLoans} tone="brand" />
          <StatCard icon={Clock} label="Pending" value={stats.pending} tone="yellow" />
          <StatCard icon={CheckCircle2} label="Approved" value={stats.approved} tone="green" />
          <StatCard icon={Wallet} label="Settled" value={stats.paid} tone="emerald" />
          <StatCard icon={Users} label="Users" value={stats.totalUsers} tone="brand" />
          <StatCard icon={Inbox} label="New enquiries" value={stats.newEnquiries} tone="blue" />
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
            <Button variant="outline" size="sm" onClick={fetchData} className="shrink-0">
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
                    <Card>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-semibold text-brand-900">{loan.full_name}</p>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${loanBadge[loan.status] ?? 'bg-brand-100 text-brand-700'}`}>
                              {cap(loan.status)}
                            </span>
                            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-600">
                              {loan.source}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-600">
                            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-brand-400" />{loan.email}</span>
                            <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-brand-400" />{loan.phone}</span>
                            <span className="flex items-center gap-1.5"><IdCard className="h-3.5 w-3.5 text-brand-400" />{loan.id_type === 'passport' ? 'Passport' : 'ID'}: {loan.id_number}</span>
                          </div>
                          <p className="flex items-start gap-1.5 text-sm text-brand-600">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
                            {loan.physical_address}
                          </p>
                          <p className="pt-1 text-xl font-bold text-brand-900">
                            P{loan.loan_amount.toLocaleString()}
                            <span className="ml-2 text-sm font-normal text-brand-500">— {loan.loan_purpose}</span>
                          </p>
                          <p className="text-xs text-brand-500">
                            {cap(loan.employment_status)}
                            {loan.term_months ? ` · Term: ${loan.term_months} month(s)` : ''}
                            {loan.monthly_income ? ` · Income: P${loan.monthly_income.toLocaleString()}` : ''}
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
                          {loan.id_photo_path && (
                            <button
                              type="button"
                              onClick={() => viewIdDocument(loan.id_photo_path!)}
                              className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
                            >
                              <IdCard className="h-4 w-4" /> View ID document
                            </button>
                          )}
                        </div>
                        <div className="w-44 shrink-0">
                          <Select
                            label="Update status"
                            hidePlaceholder
                            options={LOAN_STATUSES.map((s) => ({ value: s, label: cap(s) }))}
                            value={loan.status}
                            onChange={(e) => updateLoanStatus(loan.id, e.target.value)}
                          />
                        </div>
                      </div>
                      <RepaymentEditor loan={loan} onSave={saveRepayment} />
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
}: {
  icon: typeof FileText
  label: string
  value: number
  tone: keyof typeof toneClasses
}) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-brand-900">{value}</p>
      <p className="text-xs font-medium text-brand-500">{label}</p>
    </div>
  )
}

function RepaymentEditor({
  loan,
  onSave,
}: {
  loan: LoanRequest
  onSave: (
    id: string,
    fields: { total_repayable: number | null; amount_paid: number | null; due_date: string | null },
  ) => Promise<void>
}) {
  const [total, setTotal] = useState(loan.total_repayable != null ? String(loan.total_repayable) : '')
  const [paid, setPaid] = useState(loan.amount_paid != null ? String(loan.amount_paid) : '')
  const [due, setDue] = useState(loan.due_date ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTotal(loan.total_repayable != null ? String(loan.total_repayable) : '')
    setPaid(loan.amount_paid != null ? String(loan.amount_paid) : '')
    setDue(loan.due_date ?? '')
  }, [loan.total_repayable, loan.amount_paid, loan.due_date])

  const totalNum = total === '' ? null : Number(total)
  const paidNum = paid === '' ? 0 : Number(paid)
  const balance = totalNum != null ? Math.max(totalNum - paidNum, 0) : null

  const dirty =
    total !== (loan.total_repayable != null ? String(loan.total_repayable) : '') ||
    paid !== (loan.amount_paid != null ? String(loan.amount_paid) : '') ||
    due !== (loan.due_date ?? '')

  const handleSave = async () => {
    setSaving(true)
    await onSave(loan.id, {
      total_repayable: total === '' ? null : totalNum,
      amount_paid: paid === '' ? 0 : paidNum,
      due_date: due === '' ? null : due,
    })
    setSaving(false)
  }

  const pct =
    totalNum && totalNum > 0 ? Math.min(Math.round((paidNum / totalNum) * 100), 100) : 0

  return (
    <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-brand-800">
        <Wallet className="h-4 w-4 text-brand-500" /> Repayment tracking
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium text-brand-600">
          Total repayable (P)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="e.g. 6000"
            className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <label className="text-xs font-medium text-brand-600">
          Amount paid so far (P)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            placeholder="e.g. 2000"
            className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <label className="text-xs font-medium text-brand-600">
          Due date
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </label>
      </div>

      {balance != null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-brand-600">
            <span>Balance: <strong className="text-brand-900">P{balance.toLocaleString()}</strong></span>
            <span>{pct}% repaid</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          {balance === 0 && totalNum ? (
            <p className="mt-2 text-xs font-medium text-emerald-700">
              Fully repaid — saving will mark this loan as “paid”, freeing the client to apply again.
            </p>
          ) : null}
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save repayment'}
        </Button>
      </div>
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
