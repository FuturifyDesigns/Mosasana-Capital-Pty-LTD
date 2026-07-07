import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Globe, Upload, CheckCircle, AlertCircle, Clock, Wallet } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { supabase, type LoanRequest } from '@/lib/supabase'
import { ACTIVE_LOAN_STATUSES } from '@/lib/constants'
import { checkRateLimit, rateLimitMessage } from '@/lib/rateLimit'
import {
  loanRequestSchema,
  validateIdFile,
  sanitizeText,
  type LoanRequestFormData,
} from '@/lib/validation'
import { buildWhatsAppLoanUrl } from '@/lib/whatsapp'

type ApplyMode = 'website' | 'whatsapp'

const employmentOptions = [
  { value: 'employed', label: 'Employed' },
  { value: 'self-employed', label: 'Self-Employed' },
  { value: 'contract', label: 'Contract' },
  { value: 'other', label: 'Other' },
]

const idTypeOptions = [
  { value: 'national_id', label: 'Omang / National ID' },
  { value: 'passport', label: 'Passport (non-citizens)' },
]

export function ApplyPage() {
  const { user, profile } = useAuth()
  const [mode, setMode] = useState<ApplyMode>('website')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [activeLoan, setActiveLoan] = useState<LoanRequest | null>(null)
  const [checkingActive, setCheckingActive] = useState(true)

  useEffect(() => {
    if (!user) {
      setCheckingActive(false)
      return
    }
    let cancelled = false
    supabase
      .from('loan_requests')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ACTIVE_LOAN_STATUSES as unknown as string[])
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (cancelled) return
        setActiveLoan((data?.[0] as LoanRequest) ?? null)
        setCheckingActive(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoanRequestFormData>({
    resolver: zodResolver(loanRequestSchema),
    defaultValues: {
      fullName: profile?.full_name || '',
      email: user?.email || '',
      phone: profile?.phone || '',
      physicalAddress: profile?.physical_address || '',
      idType: 'national_id',
    },
  })

  const formValues = watch()
  const isPassport = formValues.idType === 'passport'
  const isOtherEmployment = formValues.employmentStatus === 'other'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileError(null)
    if (!file) {
      setIdFile(null)
      setIdPreview(null)
      return
    }
    const validationError = validateIdFile(file)
    if (validationError) {
      setFileError(validationError)
      setIdFile(null)
      setIdPreview(null)
      return
    }
    setIdFile(file)
    setIdPreview(URL.createObjectURL(file))
  }

  const onSubmitWebsite = async (data: LoanRequestFormData) => {
    if (!idFile) {
      setFileError('Please upload a photo of your ID document')
      return
    }

    const limit = checkRateLimit('loan-apply', 3, 10 * 60 * 1000)
    if (!limit.allowed) {
      setSubmitError(rateLimitMessage(limit.retryAfterMs))
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const fileExt = idFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${crypto.randomUUID()}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('id-documents')
        .upload(filePath, idFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: idFile.type,
        })

      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from('loan_requests').insert({
        user_id: user?.id || null,
        full_name: sanitizeText(data.fullName),
        email: sanitizeText(data.email).toLowerCase(),
        phone: sanitizeText(data.phone),
        id_number: sanitizeText(data.idNumber),
        id_type: data.idType,
        id_photo_path: filePath,
        physical_address: sanitizeText(data.physicalAddress),
        loan_amount: data.loanAmount,
        loan_purpose: sanitizeText(data.loanPurpose),
        employment_status:
          data.employmentStatus === 'other' && data.employmentOther
            ? sanitizeText(data.employmentOther)
            : data.employmentStatus,
        monthly_income: data.monthlyIncome ?? null,
        status: 'pending',
        source: 'website',
      })

      if (insertError) throw insertError

      setSuccess(true)
      setIdFile(null)
      setIdPreview(null)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <>
        <PageHero title="Application Submitted" subtitle="Thank you for choosing us." />
        <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <CheckCircle className="mx-auto h-16 w-16 text-growth-500" />
            <h2 className="mt-6 text-2xl font-bold text-brand-900">We&apos;ve Received Your Application</h2>
            <p className="mt-3 text-brand-600">
              Our team will review your request and contact you shortly. You can track the status in your dashboard.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              {user ? (
                <a href="#/dashboard">
                  <Button>View Dashboard</Button>
                </a>
              ) : (
                <a href="#/register">
                  <Button>Create Account to Track</Button>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  if (checkingActive) {
    return (
      <>
        <PageHero title="Apply for a Loan" subtitle="Checking your account…" />
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <div className="skeleton h-40 rounded-2xl" />
        </div>
      </>
    )
  }

  if (activeLoan) {
    const balance =
      activeLoan.total_repayable != null
        ? Math.max(activeLoan.total_repayable - (activeLoan.amount_paid ?? 0), 0)
        : null

    return (
      <>
        <PageHero
          title="You already have an active loan"
          subtitle="You can apply for a new loan once your current one is fully repaid."
        />
        <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-bold text-brand-900">
                    P{activeLoan.loan_amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-brand-600">{activeLoan.loan_purpose}</p>
                </div>
                <span className="ml-auto rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold capitalize text-yellow-800">
                  {activeLoan.status}
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                {activeLoan.total_repayable != null && (
                  <div className="rounded-xl bg-brand-50 p-3">
                    <dt className="text-brand-500">Total repayable</dt>
                    <dd className="font-semibold text-brand-900">
                      P{activeLoan.total_repayable.toLocaleString()}
                    </dd>
                  </div>
                )}
                {balance != null && (
                  <div className="rounded-xl bg-brand-50 p-3">
                    <dt className="text-brand-500">Outstanding balance</dt>
                    <dd className="font-semibold text-brand-900">P{balance.toLocaleString()}</dd>
                  </div>
                )}
                {activeLoan.due_date && (
                  <div className="rounded-xl bg-brand-50 p-3">
                    <dt className="flex items-center gap-1 text-brand-500">
                      <Clock className="h-3.5 w-3.5" /> Due date
                    </dt>
                    <dd className="font-semibold text-brand-900">
                      {new Date(activeLoan.due_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </dd>
                  </div>
                )}
              </dl>

              <p className="mt-5 rounded-xl bg-brand-50/70 p-3 text-sm text-brand-600">
                Once your current loan is marked as fully paid, you&apos;ll be able to submit a new
                application here. If you&apos;ve already settled it, please contact us so we can update
                your record.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/dashboard">
                  <Button>View my dashboard</Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline">Contact us</Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHero
        title="Apply for a Loan"
        subtitle="Choose to apply through our secure website form or via WhatsApp — both options are available."
        titleKey="apply.hero.title"
        subtitleKey="apply.hero.subtitle"
      />

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex rounded-2xl bg-brand-100 p-1">
          <button
            type="button"
            onClick={() => setMode('website')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              mode === 'website' ? 'bg-white text-brand-800 shadow-sm' : 'text-brand-600'
            }`}
          >
            <Globe className="h-4 w-4" /> Apply via Website
          </button>
          <button
            type="button"
            onClick={() => setMode('whatsapp')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              mode === 'whatsapp' ? 'bg-white text-brand-800 shadow-sm' : 'text-brand-600'
            }`}
          >
            <WhatsAppIcon className="h-4 w-4" /> Apply via WhatsApp
          </button>
        </div>

        {mode === 'whatsapp' ? (
          <Card>
            <h2 className="text-xl font-semibold text-brand-900">Apply Through WhatsApp</h2>
            <p className="mt-2 text-brand-600">
              Fill in your details below, then continue on WhatsApp to send your application and attach your ID photo.
            </p>
            <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()} noValidate>
              <Input
                label="Full Name"
                required
                hint="Letters only — as on your ID (no numbers)."
                {...register('fullName')}
                error={errors.fullName?.message}
              />
              <Input
                label="Email"
                type="email"
                required
                hint="A valid email address."
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label="Phone"
                required
                type="tel"
                inputMode="tel"
                hint="Botswana number, 8 digits."
                {...register('phone')}
                error={errors.phone?.message}
              />
              <Select
                label="Document Type"
                options={idTypeOptions}
                required
                hint="Choose Omang for citizens, or Passport for non-citizens."
                {...register('idType')}
                error={errors.idType?.message}
              />
              <Input
                label={isPassport ? 'Passport Number' : 'Omang / National ID Number'}
                required
                inputMode={isPassport ? 'text' : 'numeric'}
                hint={
                  isPassport
                    ? 'Letters and numbers (6–15 characters).'
                    : 'Digits only (9–12 numbers).'
                }
                {...register('idNumber')}
                error={errors.idNumber?.message}
              />
              <Textarea
                label="Physical Address"
                rows={3}
                required
                hint="Include plot number, street, and city/town."
                {...register('physicalAddress')}
                error={errors.physicalAddress?.message}
              />
              <Input
                label="Loan Amount (Pula)"
                type="number"
                required
                inputMode="numeric"
                hint="Numbers only, between P500 and P50,000."
                {...register('loanAmount', { valueAsNumber: true })}
                error={errors.loanAmount?.message}
              />
              <Textarea
                label="Purpose of Loan"
                rows={3}
                required
                hint="Briefly describe what the loan is for."
                {...register('loanPurpose')}
                error={errors.loanPurpose?.message}
              />
              <Select
                label="Employment Status"
                options={employmentOptions}
                required
                hint="Select the option that best describes you."
                {...register('employmentStatus')}
                error={errors.employmentStatus?.message}
              />
              {isOtherEmployment && (
                <Input
                  label="Please specify"
                  required
                  hint="Tell us what you do (e.g. student, pensioner, business owner)."
                  {...register('employmentOther')}
                  error={errors.employmentOther?.message}
                />
              )}
              <a
                href={buildWhatsAppLoanUrl(formValues)}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="whatsapp" className="w-full" type="button">
                  <WhatsAppIcon className="h-5 w-5" />
                  Continue on WhatsApp
                </Button>
              </a>
            </form>
          </Card>
        ) : (
          <Card>
            <h2 className="text-xl font-semibold text-brand-900">Secure Loan Application</h2>
            <p className="mt-2 text-brand-600">
              All information is encrypted and securely stored. Please upload a clear photo of your ID document.
            </p>

            {submitError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{submitError}</p>
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmitWebsite)} noValidate>
              <Input
                label="Full Name"
                required
                hint="Letters only — as on your ID (no numbers)."
                {...register('fullName')}
                error={errors.fullName?.message}
              />
              <Input
                label="Email"
                type="email"
                required
                hint="A valid email address."
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label="Phone"
                required
                type="tel"
                inputMode="tel"
                hint="Botswana number, 8 digits."
                {...register('phone')}
                error={errors.phone?.message}
              />
              <Select
                label="Document Type"
                options={idTypeOptions}
                required
                hint="Choose Omang for citizens, or Passport for non-citizens."
                {...register('idType')}
                error={errors.idType?.message}
              />
              <Input
                label={isPassport ? 'Passport Number' : 'Omang / National ID Number'}
                required
                inputMode={isPassport ? 'text' : 'numeric'}
                hint={
                  isPassport
                    ? 'Letters and numbers (6–15 characters).'
                    : 'Digits only (9–12 numbers).'
                }
                {...register('idNumber')}
                error={errors.idNumber?.message}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-brand-800">
                  {isPassport ? 'Passport Photo' : 'ID Document Photo'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div
                  className={`relative rounded-xl border-2 border-dashed p-6 text-center transition ${
                    fileError ? 'border-red-400 bg-red-50' : 'border-brand-200 bg-brand-50 hover:border-brand-400'
                  }`}
                >
                  {idPreview ? (
                    <div className="space-y-3">
                      <img src={idPreview} alt="ID preview" className="mx-auto max-h-40 rounded-lg object-contain" />
                      <p className="text-sm text-brand-600">{idFile?.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-10 w-10 text-brand-400" />
                      <p className="text-sm text-brand-600">JPEG, PNG or WebP — max 5MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
                {fileError && <p className="text-sm text-red-600">{fileError}</p>}
              </div>

              <Textarea
                label="Physical Address"
                rows={3}
                required
                hint="Include plot number, street, and city/town."
                {...register('physicalAddress')}
                error={errors.physicalAddress?.message}
              />
              <Input
                label="Loan Amount (Pula)"
                type="number"
                required
                min={500}
                max={50000}
                inputMode="numeric"
                hint="Numbers only, between P500 and P50,000."
                {...register('loanAmount', { valueAsNumber: true })}
                error={errors.loanAmount?.message}
              />
              <Textarea
                label="Purpose of Loan"
                rows={3}
                required
                hint="Briefly describe what the loan is for."
                {...register('loanPurpose')}
                error={errors.loanPurpose?.message}
              />
              <Select
                label="Employment Status"
                options={employmentOptions}
                required
                hint="Select the option that best describes you."
                {...register('employmentStatus')}
                error={errors.employmentStatus?.message}
              />
              {isOtherEmployment && (
                <Input
                  label="Please specify"
                  required
                  hint="Tell us what you do (e.g. student, pensioner, business owner)."
                  {...register('employmentOther')}
                  error={errors.employmentOther?.message}
                />
              )}
              <Input
                label="Monthly Income (Pula, optional)"
                type="number"
                min={0}
                inputMode="numeric"
                hint="Optional — numbers only."
                {...register('monthlyIncome', {
                  setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
                })}
                error={errors.monthlyIncome?.message}
              />

              <Button type="submit" className="w-full" loading={submitting}>
                Submit Application
              </Button>
            </form>
          </Card>
        )}
      </section>
    </>
  )
}
