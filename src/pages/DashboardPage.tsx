import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, FileText, Clock } from 'lucide-react'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { supabase, type LoanRequest } from '@/lib/supabase'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  disbursed: 'bg-brand-100 text-brand-800',
}

export function DashboardPage() {
  const { user, profile } = useAuth()
  const [loans, setLoans] = useState<LoanRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchLoans = async () => {
      const { data } = await supabase
        .from('loan_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setLoans((data as LoanRequest[]) || [])
      setLoading(false)
    }

    fetchLoans()
  }, [user])

  return (
    <>
      <PageHero
        title="My Dashboard"
        subtitle={`Welcome back, ${profile?.full_name || user?.email || 'Client'}`}
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-brand-900">Your Loan Applications</h2>
          <Link to="/apply">
            <Button size="sm">
              <Plus className="h-4 w-4" /> New Application
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : loans.length === 0 ? (
          <Card className="text-center">
            <FileText className="mx-auto h-12 w-12 text-brand-300" />
            <h3 className="mt-4 text-lg font-semibold text-brand-900">No Applications Yet</h3>
            <p className="mt-2 text-brand-600">Submit your first loan application to get started.</p>
            <Link to="/apply" className="mt-6 inline-block">
              <Button>Apply for a Loan</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {loans.map((loan, i) => (
              <motion.div
                key={loan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card hover>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-brand-900">
                        P{loan.loan_amount.toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm text-brand-600">{loan.loan_purpose}</p>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-500">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(loan.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        statusColors[loan.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {loan.status}
                    </span>
                  </div>
                  {loan.admin_notes && (
                    <p className="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
                      <span className="font-medium">Note:</span> {loan.admin_notes}
                    </p>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
