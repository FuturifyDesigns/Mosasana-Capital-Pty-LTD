import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  MessageSquare,
  RefreshCw,
  Search,
  Clock,
  CheckCircle2,
  Banknote,
  Inbox,
  Mail,
  Phone,
  MapPin,
  IdCard,
} from 'lucide-react'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { supabase, type LoanRequest, type ContactEnquiry } from '@/lib/supabase'
import { LOAN_STATUSES, ENQUIRY_STATUSES } from '@/lib/constants'

type Tab = 'loans' | 'enquiries'

const loanBadge: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
  disbursed: 'bg-brand-100 text-brand-800',
}

const enquiryBadge: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  read: 'bg-brand-100 text-brand-700',
  responded: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('loans')
  const [loans, setLoans] = useState<LoanRequest[]>([])
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchData = async () => {
    setLoading(true)
    const [loansRes, enquiriesRes] = await Promise.all([
      supabase.from('loan_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_enquiries').select('*').order('created_at', { ascending: false }),
    ])
    setLoans((loansRes.data as LoanRequest[]) || [])
    setEnquiries((enquiriesRes.data as ContactEnquiry[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const updateLoanStatus = async (id: string, status: string) => {
    setLoans((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
    await supabase.from('loan_requests').update({ status }).eq('id', id)
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
      newEnquiries: enquiries.filter((e) => e.status === 'new').length,
    }),
    [loans, enquiries],
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={FileText} label="Total loans" value={stats.totalLoans} tone="brand" />
          <StatCard icon={Clock} label="Pending" value={stats.pending} tone="yellow" />
          <StatCard icon={CheckCircle2} label="Approved" value={stats.approved} tone="green" />
          <StatCard icon={Banknote} label="Disbursed" value={stats.disbursed} tone="brand" />
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
          </div>

          <div className="flex flex-1 flex-col gap-3 sm:flex-row lg:max-w-lg lg:justify-end">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tab === 'loans' ? 'Search name, email, ID…' : 'Search name, email, subject…'}
                className="w-full rounded-xl border border-brand-200 bg-white py-2.5 pl-9 pr-3 text-sm text-brand-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                hidePlaceholder
                aria-label="Filter by status"
              />
            </div>
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
                            <span className="flex items-center gap-1.5"><IdCard className="h-3.5 w-3.5 text-brand-400" />{loan.id_number}</span>
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
                            {loan.monthly_income ? ` · Income: P${loan.monthly_income.toLocaleString()}` : ''}
                            {' · '}
                            {new Date(loan.created_at).toLocaleString()}
                          </p>
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
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-white/60 py-16 text-center">
      <Inbox className="h-10 w-10 text-brand-300" />
      <p className="mt-3 text-brand-600">{label}</p>
    </div>
  )
}
