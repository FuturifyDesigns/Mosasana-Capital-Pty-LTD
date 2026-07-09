import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  Wallet,
  Users,
  Ban,
  Trash2,
  ShieldCheck,
  X,
  Archive,
} from 'lucide-react'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { supabase, type LoanRequest, type ContactEnquiry, type AdminUser, type LoanPayment } from '@/lib/supabase'
import { ENQUIRY_STATUSES, IN_REVIEW_LOAN_STATUSES, OPEN_LOAN_PIPELINE_STATUSES, CLOSED_LOAN_STATUSES } from '@/lib/constants'
import { getLoanStatusLabelKey, isLoanLocked, validateStatusChange } from '@/lib/loanStatus'
import { LoanRequestCard } from '@/components/admin/LoanRequestCard'
import { ClientRecordsPanel } from '@/components/admin/ClientRecordsPanel'
import { buildClientRecords, filterClientRecords } from '@/lib/clientRecords'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import {
  mergeEnquiryFromPayload,
  mergeLoanFromPayload,
  mergePaymentFromPayload,
  subscribeAdminTables,
} from '@/lib/realtime'

type Tab = 'loans' | 'records' | 'enquiries' | 'users'

interface ReminderLogRow {
  loan_id: string
  kind: string
  created_at: string
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
  const { t } = useLanguage()
  const { isAdmin, loading: authLoading } = useAuth()
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [tab, setTab] = useState<Tab>('loans')
  const [loans, setLoans] = useState<LoanRequest[]>([])
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [payments, setPayments] = useState<LoanPayment[]>([])
  const [reminderLog, setReminderLog] = useState<ReminderLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loanPipeline, setLoanPipeline] = useState<'active' | 'archive'>('active')
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null)
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
            (l) => l.user_id === p.id && !['rejected', 'paid', 'discontinued'].includes(l.status),
          ).length,
        })),
      )
      if (usersRes.error.code === 'PGRST202') {
        showToast(t('admin.toast.rpcHint'), 'info')
      }
    } else {
      setUsers((usersRes.data as AdminUser[]) || [])
    }

    if (!options?.silent) setLoading(false)
  }, [showToast, t])

  const loadIdDocUrl = useCallback(async (path: string) => {
    const { data } = await supabase.storage.from('id-documents').createSignedUrl(path, 300)
    if (!data?.signedUrl) return
    setIdDocUrls((prev) => ({ ...prev, [path]: data.signedUrl }))
  }, [])

  const scheduleSync = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      void fetchData({ silent: true })
    }, 300)
  }, [fetchData])

  useEffect(() => {
    if (authLoading || !isAdmin) return
    void fetchData()
  }, [authLoading, isAdmin, fetchData])

  // Live updates: merge row changes instantly, then sync users/stats in the background.
  useEffect(() => {
    if (authLoading || !isAdmin) return

    const channel = subscribeAdminTables('admin-realtime', {
      onLoanChange: (payload) => {
        setLoans((prev) => mergeLoanFromPayload(prev, payload) as LoanRequest[])
        if (payload.eventType === 'INSERT') {
          const path = (payload.new as unknown as LoanRequest | null)?.id_photo_path
          if (path) void loadIdDocUrl(path)
        }
      },
      onEnquiryChange: (payload) => {
        setEnquiries((prev) => mergeEnquiryFromPayload(prev, payload) as ContactEnquiry[])
      },
      onPaymentChange: (payload) => {
        setPayments((prev) => mergePaymentFromPayload(prev, payload) as LoanPayment[])
      },
      onSync: scheduleSync,
    })

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
      void supabase.removeChannel(channel)
    }
  }, [authLoading, isAdmin, loadIdDocUrl, scheduleSync])

  // Refetch when the admin tab becomes visible again (e.g. after switching browser tabs).
  useEffect(() => {
    if (authLoading || !isAdmin) return

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void fetchData({ silent: true })
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [authLoading, isAdmin, fetchData])

  const banUser = async (u: AdminUser) => {
    const next = !u.banned
    const displayName = u.full_name || u.email
    if (next) {
      const ok = await confirm({
        title: t('admin.confirm.ban.title'),
        message: t('admin.confirm.ban.message', { name: displayName }),
        confirmLabel: t('admin.confirm.ban.confirm'),
        cancelLabel: t('common.cancel'),
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
      showToast(next ? t('admin.toast.userBanned') : t('admin.toast.userUnbanned'), 'success')
    }
  }

  const deleteUser = async (u: AdminUser) => {
    const displayName = u.full_name || u.email
    const ok = await confirm({
      title: t('admin.confirm.deleteUser.title'),
      message: t('admin.confirm.deleteUser.message', { name: displayName }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    })
    if (!ok) return
    const { error } = await supabase.rpc('admin_delete_user', { target: u.id })
    if (error) {
      showToast(error.message || 'Could not delete user.', 'error')
    } else {
      setUsers((prev) => prev.filter((x) => x.id !== u.id))
      showToast(t('admin.toast.userDeleted'), 'success')
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
    showToast(t('admin.toast.statusUpdated', { status: t(getLoanStatusLabelKey(status)) }), 'success')
  }

  const discontinueLoan = async (loan: LoanRequest) => {
    const ok = await confirm({
      title: t('admin.confirm.discontinue.title'),
      message: t('admin.confirm.discontinue.message', { name: loan.full_name }),
      confirmLabel: t('admin.loan.discontinue'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    })
    if (!ok) return

    const { error } = await supabase.rpc('admin_discontinue_loan', { p_loan_id: loan.id })
    if (error) {
      showToast(error.message || 'Could not discontinue loan request.', 'error')
      return
    }
    setExpandedLoanId((id) => (id === loan.id ? null : id))
    await fetchData({ silent: true })
    showToast(t('admin.toast.loanDiscontinued'), 'success')
  }

  const deleteLoanRequest = async (loan: LoanRequest) => {
    const ok = await confirm({
      title: t('admin.confirm.deleteLoan.title'),
      message: t('admin.confirm.deleteLoan.message', { name: loan.full_name }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    })
    if (!ok) return

    const { error } = await supabase.rpc('admin_delete_loan_request', { p_loan_id: loan.id })
    if (error) {
      showToast(error.message || 'Could not delete loan request.', 'error')
      return
    }
    setLoans((prev) => prev.filter((l) => l.id !== loan.id))
    setExpandedLoanId((id) => (id === loan.id ? null : id))
    showToast(t('admin.toast.loanDeleted'), 'success')
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
      showToast(t('admin.toast.paidRejectedLocked'), 'error')
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
      inReview: loans.filter((l) =>
        (IN_REVIEW_LOAN_STATUSES as readonly string[]).includes(l.status),
      ).length,
      approved: loans.filter((l) => l.status === 'approved').length,
      disbursed: loans.filter((l) => l.status === 'disbursed').length,
      openPipeline: loans.filter((l) =>
        (OPEN_LOAN_PIPELINE_STATUSES as readonly string[]).includes(l.status),
      ).length,
      archived: loans.filter((l) =>
        (CLOSED_LOAN_STATUSES as readonly string[]).includes(l.status),
      ).length,
      fundedClients: filterClientRecords(buildClientRecords(loans, users), 'funded').length,
      newEnquiries: enquiries.filter((e) => e.status === 'new').length,
      totalUsers: users.length,
    }),
    [loans, enquiries, users],
  )

  const filteredLoans = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pipelineStatuses =
      loanPipeline === 'active'
        ? (OPEN_LOAN_PIPELINE_STATUSES as readonly string[])
        : (CLOSED_LOAN_STATUSES as readonly string[])

    return loans.filter((l) => {
      const inPipeline = pipelineStatuses.includes(l.status)
      const matchesStatus =
        statusFilter === 'all' ||
        l.status === statusFilter ||
        (statusFilter === 'reviewing' && l.status === 'pending')
      const matchesQuery =
        !q ||
        l.full_name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.id_number.includes(q)
      return inPipeline && matchesStatus && matchesQuery
    })
  }, [loans, query, statusFilter, loanPipeline])

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

  const returningBorrowers = useMemo(() => {
    const totalsByUser = new Map<string, number>()
    const totalsByEmail = new Map<string, number>()
    const settledByUser = new Map<string, number>()
    const settledByEmail = new Map<string, number>()
    for (const loan of loans) {
      const emailKey = loan.email.trim().toLowerCase()
      totalsByEmail.set(emailKey, (totalsByEmail.get(emailKey) ?? 0) + 1)
      if (loan.user_id) {
        totalsByUser.set(loan.user_id, (totalsByUser.get(loan.user_id) ?? 0) + 1)
      }
      if (loan.status === 'paid') {
        settledByEmail.set(emailKey, (settledByEmail.get(emailKey) ?? 0) + 1)
        if (loan.user_id) {
          settledByUser.set(loan.user_id, (settledByUser.get(loan.user_id) ?? 0) + 1)
        }
      }
    }
    return { totalsByUser, totalsByEmail, settledByUser, settledByEmail }
  }, [loans])

  const loanStatusOptions = useMemo(() => {
    const statuses =
      loanPipeline === 'active'
        ? [...OPEN_LOAN_PIPELINE_STATUSES]
        : [...CLOSED_LOAN_STATUSES]
    return [
      { value: 'all', label: t('admin.filter.allStatuses') },
      ...statuses.map((s) => ({ value: s, label: t(getLoanStatusLabelKey(s)) })),
    ]
  }, [loanPipeline, t])

  const statusOptions =
    tab === 'loans'
      ? loanStatusOptions
      : tab === 'enquiries'
        ? [{ value: 'all', label: t('admin.filter.allStatuses') }, ...ENQUIRY_STATUSES.map((s) => ({ value: s, label: cap(s) }))]
        : []

  const switchTab = (t: Tab) => {
    setTab(t)
    setStatusFilter('all')
    setQuery('')
    setLoanPipeline('active')
    setExpandedLoanId(null)
  }

  return (
    <>
      <PageHero title={t('admin.hero.title')} subtitle={t('admin.hero.subtitle')} />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <StatCard icon={FileText} label={t('admin.stat.totalLoans')} value={stats.totalLoans} tone="brand" />
          <StatCard icon={Clock} label={t('admin.stat.inReview')} value={stats.inReview} tone="blue" highlight={stats.inReview > 0} />
          <StatCard icon={CheckCircle2} label={t('admin.stat.approved')} value={stats.approved} tone="green" />
          <StatCard icon={Wallet} label={t('admin.stat.settled')} value={stats.archived} tone="emerald" />
          <StatCard icon={Archive} label={t('admin.stat.fundedClients')} value={stats.fundedClients} tone="green" />
          <StatCard icon={Inbox} label={t('admin.stat.newEnquiries')} value={stats.newEnquiries} tone="blue" highlight={stats.newEnquiries > 0} />
          <StatCard icon={Users} label={t('admin.stat.users')} value={stats.totalUsers} tone="brand" />
        </div>

        {/* Controls */}
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-brand-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => switchTab('loans')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === 'loans' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
              }`}
            >
              <FileText className="h-4 w-4" />
              {t('admin.tab.loans')}
              {stats.inReview > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{stats.inReview}</span>
              )}
            </button>
            <button
              onClick={() => switchTab('records')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === 'records' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
              }`}
            >
              <Archive className="h-4 w-4" />
              {t('admin.tab.records')}
            </button>
            <button
              onClick={() => switchTab('enquiries')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === 'enquiries' ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              {t('admin.tab.enquiries')}
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
              {t('admin.tab.users')}
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
                    ? t('admin.search.loans')
                    : tab === 'records'
                      ? t('admin.search.records')
                      : tab === 'users'
                        ? t('admin.search.users')
                        : t('admin.search.enquiries')
                }
                className="w-full rounded-xl border border-brand-200 bg-white py-2.5 pl-9 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            {tab === 'loans' || tab === 'enquiries' ? (
              <div className="w-full sm:w-44">
                <Select
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  hidePlaceholder
                  aria-label={t('admin.filterByStatus')}
                />
              </div>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => fetchData()} className="shrink-0">
              <RefreshCw className="h-4 w-4" /> {t('common.refresh')}
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoanPipeline('active')
                    setStatusFilter('all')
                    setExpandedLoanId(null)
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    loanPipeline === 'active'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50'
                  }`}
                >
                  {t('admin.pipeline.active', { count: stats.openPipeline })}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoanPipeline('archive')
                    setStatusFilter('all')
                    setExpandedLoanId(null)
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    loanPipeline === 'archive'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50'
                  }`}
                >
                  {t('admin.pipeline.archive', { count: stats.archived })}
                </button>
              </div>
              <p className="text-sm text-brand-600">
                {loanPipeline === 'active'
                  ? t('admin.pipeline.activeHint')
                  : t('admin.pipeline.archiveHint')}
              </p>

              {filteredLoans.length === 0 ? (
                <EmptyState
                  label={
                    loanPipeline === 'active'
                      ? t('admin.empty.noActiveLoans')
                      : t('admin.empty.noArchivedLoans')
                  }
                />
              ) : (
                filteredLoans.map((loan, i) => (
                  <motion.div
                    key={loan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  >
                    <LoanRequestCard
                      loan={loan}
                      isReturningBorrower={
                        (() => {
                          const emailKey = loan.email.trim().toLowerCase()
                          const totalCount = loan.user_id
                            ? (returningBorrowers.totalsByUser.get(loan.user_id) ?? 0)
                            : (returningBorrowers.totalsByEmail.get(emailKey) ?? 0)
                          const settledCount = loan.user_id
                            ? (returningBorrowers.settledByUser.get(loan.user_id) ?? 0)
                            : (returningBorrowers.settledByEmail.get(emailKey) ?? 0)
                          return totalCount > 1 && settledCount > 0
                        })()
                      }
                      payments={payments}
                      remindersByLoan={remindersByLoan}
                      idDocUrl={loan.id_photo_path ? idDocUrls[loan.id_photo_path] : undefined}
                      expanded={expandedLoanId === loan.id}
                      onToggle={() =>
                        setExpandedLoanId((id) => (id === loan.id ? null : loan.id))
                      }
                      onPreviewDoc={(name, url) => setPreviewDoc({ name, url })}
                      onStatusChange={updateLoanStatus}
                      onSaveTerms={saveRepaymentTerms}
                      onPaymentRecorded={() => fetchData({ silent: true })}
                      onDiscontinue={discontinueLoan}
                      onDelete={deleteLoanRequest}
                    />
                  </motion.div>
                ))
              )}
            </div>
          ) : tab === 'records' ? (
            <ClientRecordsPanel
              loans={loans}
              users={users}
              query={query}
              idDocUrls={idDocUrls}
              onPreviewDoc={(name, url) => setPreviewDoc({ name, url })}
            />
          ) : tab === 'enquiries' ? (
            <div className="space-y-4">
              {filteredEnquiries.length === 0 ? (
                <EmptyState label={t('admin.empty.noEnquiries')} />
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
                                <Mail className="h-4 w-4" /> {t('admin.enquiry.replyByEmail')}
                              </Button>
                            </a>
                          </div>
                        </div>
                        <div className="w-44 shrink-0">
                          <Select
                            label={t('admin.enquiry.updateStatus')}
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
                <EmptyState label={t('admin.empty.noUsers')} />
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
                              {u.full_name || t('admin.user.noName')}
                            </p>
                            {u.role === 'admin' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                                <ShieldCheck className="h-3.5 w-3.5" /> {t('admin.user.admin')}
                              </span>
                            )}
                            {u.banned && (
                              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                                {t('admin.user.banned')}
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
                            {u.loan_count === 1
                              ? t('admin.user.loans', { count: u.loan_count })
                              : t('admin.user.loansPlural', { count: u.loan_count })}
                            {u.active_loan_count > 0
                              ? ` · ${t('admin.user.active', { count: u.active_loan_count })}`
                              : ''}
                            {' · '}
                            {t('admin.user.joined', {
                              date: new Date(u.created_at).toLocaleDateString(),
                            })}
                          </p>
                        </div>
                        {u.role !== 'admin' && (
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => banUser(u)}
                            >
                              <Ban className="h-4 w-4" /> {u.banned ? t('admin.user.unban') : t('admin.user.ban')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteUser(u)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" /> {t('common.delete')}
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
                aria-label={t('admin.preview.close')}
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
