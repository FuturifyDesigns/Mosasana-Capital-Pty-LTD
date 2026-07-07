import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Globe, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
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

export function ApplyPage() {
  const { user, profile } = useAuth()
  const [mode, setMode] = useState<ApplyMode>('website')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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
    },
  })

  const formValues = watch()

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
        id_photo_path: filePath,
        physical_address: sanitizeText(data.physicalAddress),
        loan_amount: data.loanAmount,
        loan_purpose: sanitizeText(data.loanPurpose),
        employment_status: data.employmentStatus,
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

  return (
    <>
      <PageHero
        title="Apply for a Loan"
        subtitle="Choose to apply through our secure website form or via WhatsApp — both options are available."
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
              <Input label="Full Name" required {...register('fullName')} error={errors.fullName?.message} />
              <Input label="Email" type="email" required {...register('email')} error={errors.email?.message} />
              <Input label="Phone" required {...register('phone')} error={errors.phone?.message} />
              <Input label="ID Number" required {...register('idNumber')} error={errors.idNumber?.message} />
              <Textarea
                label="Physical Address"
                rows={3}
                required
                {...register('physicalAddress')}
                error={errors.physicalAddress?.message}
              />
              <Input
                label="Loan Amount (Pula)"
                type="number"
                required
                {...register('loanAmount', { valueAsNumber: true })}
                error={errors.loanAmount?.message}
              />
              <Textarea
                label="Purpose of Loan"
                rows={3}
                required
                {...register('loanPurpose')}
                error={errors.loanPurpose?.message}
              />
              <Select
                label="Employment Status"
                options={employmentOptions}
                required
                {...register('employmentStatus')}
                error={errors.employmentStatus?.message}
              />
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
              <Input label="Full Name" required {...register('fullName')} error={errors.fullName?.message} />
              <Input label="Email" type="email" required {...register('email')} error={errors.email?.message} />
              <Input label="Phone" required {...register('phone')} error={errors.phone?.message} />
              <Input label="ID Number" required {...register('idNumber')} error={errors.idNumber?.message} />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-brand-800">
                  ID Document Photo <span className="text-red-500">*</span>
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
                {...register('physicalAddress')}
                error={errors.physicalAddress?.message}
              />
              <Input
                label="Loan Amount (Pula)"
                type="number"
                required
                min={500}
                max={50000}
                {...register('loanAmount', { valueAsNumber: true })}
                error={errors.loanAmount?.message}
              />
              <Textarea
                label="Purpose of Loan"
                rows={3}
                required
                {...register('loanPurpose')}
                error={errors.loanPurpose?.message}
              />
              <Select
                label="Employment Status"
                options={employmentOptions}
                required
                {...register('employmentStatus')}
                error={errors.employmentStatus?.message}
              />
              <Input
                label="Monthly Income (Pula, optional)"
                type="number"
                min={0}
                {...register('monthlyIncome', { valueAsNumber: true })}
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
