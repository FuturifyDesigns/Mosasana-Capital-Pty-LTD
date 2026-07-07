import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, MessageSquare, RefreshCw } from 'lucide-react'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { supabase, type LoanRequest, type ContactEnquiry } from '@/lib/supabase'
import { LOAN_STATUSES, ENQUIRY_STATUSES } from '@/lib/constants'

type Tab = 'loans' | 'enquiries'

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('loans')
  const [loans, setLoans] = useState<LoanRequest[]>([])
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([])
  const [loading, setLoading] = useState(true)

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
    await supabase.from('loan_requests').update({ status }).eq('id', id)
    fetchData()
  }

  const updateEnquiryStatus = async (id: string, status: string) => {
    await supabase.from('contact_enquiries').update({ status }).eq('id', id)
    fetchData()
  }

  const pendingLoans = loans.filter((l) => l.status === 'pending').length
  const newEnquiries = enquiries.filter((e) => e.status === 'new').length

  return (
    <>
      <PageHero title="Admin Portal" subtitle="Manage loan applications and contact enquiries." />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('loans')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === 'loans' ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              Loan Requests
              {pendingLoans > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{pendingLoans}</span>
              )}
            </button>
            <button
              onClick={() => setTab('enquiries')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === 'enquiries' ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Enquiries
              {newEnquiries > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{newEnquiries}</span>
              )}
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        ) : tab === 'loans' ? (
          <div className="space-y-4">
            {loans.length === 0 ? (
              <Card className="text-center text-brand-600">No loan requests yet.</Card>
            ) : (
              loans.map((loan, i) => (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-brand-900">{loan.full_name}</p>
                        <p className="text-sm text-brand-600">
                          {loan.email} &middot; {loan.phone}
                        </p>
                        <p className="text-sm text-brand-600">ID: {loan.id_number}</p>
                        <p className="text-sm text-brand-600">{loan.physical_address}</p>
                        <p className="mt-2 font-medium text-brand-800">
                          P{loan.loan_amount.toLocaleString()} — {loan.loan_purpose}
                        </p>
                        <p className="text-xs text-brand-500">
                          {loan.employment_status}
                          {loan.monthly_income ? ` · Income: P${loan.monthly_income}` : ''}
                          {' · '}
                          Source: {loan.source}
                          {' · '}
                          {new Date(loan.created_at).toLocaleString()}
                        </p>
                        {loan.id_photo_path && (
                          <button
                            type="button"
                            onClick={async () => {
                              const { data } = await supabase.storage
                                .from('id-documents')
                                .createSignedUrl(loan.id_photo_path!, 300)
                              if (data?.signedUrl) window.open(data.signedUrl, '_blank')
                            }}
                            className="mt-2 inline-block text-sm font-medium text-brand-600 hover:text-brand-800"
                          >
                            View ID Document →
                          </button>
                        )}
                      </div>
                      <div className="w-40">
                        <Select
                          label="Status"
                          options={LOAN_STATUSES.map((s) => ({
                            value: s,
                            label: s.charAt(0).toUpperCase() + s.slice(1),
                          }))}
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
            {enquiries.length === 0 ? (
              <Card className="text-center text-brand-600">No enquiries yet.</Card>
            ) : (
              enquiries.map((enquiry, i) => (
                <motion.div
                  key={enquiry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-brand-900">{enquiry.full_name}</p>
                        <p className="text-sm text-brand-600">
                          {enquiry.email}
                          {enquiry.phone ? ` · ${enquiry.phone}` : ''}
                        </p>
                        <p className="mt-2 font-medium text-brand-800">{enquiry.subject}</p>
                        <p className="mt-1 text-sm text-brand-600">{enquiry.message}</p>
                        <p className="mt-2 text-xs text-brand-500">
                          {new Date(enquiry.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="w-40">
                        <Select
                          label="Status"
                          options={ENQUIRY_STATUSES.map((s) => ({
                            value: s,
                            label: s.charAt(0).toUpperCase() + s.slice(1),
                          }))}
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
      </section>
    </>
  )
}
