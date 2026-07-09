import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Globe, Upload, CheckCircle, AlertCircle, Clock, Wallet } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { useConfirm } from '@/context/ConfirmContext'
import { useLanguage } from '@/context/LanguageContext'
import { supabase, type LoanRequest } from '@/lib/supabase'
import { ACTIVE_LOAN_STATUSES, COMPANY, LOAN_TERMS } from '@/lib/constants'
import { checkRateLimit, rateLimitMessage } from '@/lib/rateLimit'
import { formatSupabaseError } from '@/lib/supabaseErrors'
import {
  createLoanRequestSchema,
  validateIdFile,
  sanitizeText,
  imageContentType,
  toDisbursementDbFields,
  type LoanRequestFormData,
} from '@/lib/validation'
import { buildWhatsAppLoanUrl } from '@/lib/whatsapp'
import { RegulatoryNotice } from '@/components/RegulatoryNotice'
import { PrivacyConsentField } from '@/components/PrivacyConsentField'
import { DisbursementFields } from '@/components/DisbursementFields'
import { EditableText } from '@/components/editable/EditableText'
import { formatPula } from '@/lib/format'
import { normalizeBotswanaPhone } from '@/lib/phone'
import { checkIdentityForLoanApplication } from '@/lib/identityChecks'
import { getOutstandingBalance } from '@/lib/loans'

type ApplyMode = 'website' | 'whatsapp'

export function ApplyPage() {
  const { user, profile } = useAuth()
  const { confirm } = useConfirm()
  const { t, language } = useLanguage()
  const [mode, setMode] = useState<ApplyMode>('website')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [activeLoan, setActiveLoan] = useState<LoanRequest | null>(null)
  const [checkingActive, setCheckingActive] = useState(true)

  const employmentOptions = useMemo(
    () => [
      { value: 'employed', label: t('apply.employment.employed') },
      { value: 'self-employed', label: t('apply.employment.selfEmployed') },
      { value: 'contract', label: t('apply.employment.contract') },
      { value: 'other', label: t('apply.employment.other') },
    ],
    [t],
  )

  const idTypeOptions = useMemo(
    () => [
      { value: 'national_id', label: t('apply.idType.nationalId') },
      { value: 'passport', label: t('apply.idType.passport') },
    ],
    [t],
  )

  const termOptions = useMemo(
    () => LOAN_TERMS.map((term) => ({ value: String(term.value), label: term.label })),
    [],
  )

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

  const loanRequestSchema = useMemo(() => createLoanRequestSchema(t), [t])

  const {
    register,
    handleSubmit,
    watch,
    control,
    setError,
    formState: { errors },
  } = useForm<LoanRequestFormData>({
    resolver: zodResolver(loanRequestSchema),
    defaultValues: {
      fullName: profile?.full_name || '',
      email: user?.email || '',
      phone: normalizeBotswanaPhone(profile?.phone || ''),
      physicalAddress: profile?.physical_address || '',
      bankAccountHolderName: profile?.full_name || '',
      bankBranchCode: '',
      bankBranchName: '',
      idType: 'national_id',
      termMonths: 3,
      acceptPrivacy: false,
    },
  })

  const formValues = watch()
  const isPassport = formValues.idType === 'passport'
  const isOtherEmployment = formValues.employmentStatus === 'other'

  const confirmHighBorrowingRisk = async (
    data: Partial<LoanRequestFormData>,
  ): Promise<boolean> => {
    const income =
      data.monthlyIncome == null || data.monthlyIncome === ('' as unknown as number)
        ? null
        : Number(data.monthlyIncome)
    const amount =
      data.loanAmount == null || data.loanAmount === ('' as unknown as number)
        ? null
        : Number(data.loanAmount)

    if (!income || !amount || !Number.isFinite(income) || !Number.isFinite(amount)) return true
    if (income <= 0 || amount <= income) return true

    return confirm({
      title: t('apply.borrowing.title'),
      message: t('apply.borrowing.message'),
      confirmLabel: t('apply.borrowing.confirm'),
      cancelLabel: t('apply.borrowing.cancel'),
      tone: 'warning',
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileError(null)
    if (!file) {
      setIdFile(null)
      setIdPreview(null)
      return
    }
    const validationError = validateIdFile(file, t)
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
      setFileError(t('apply.error.idRequired'))
      return
    }

    if (!(await confirmHighBorrowingRisk(data))) {
      return
    }

    const limit = checkRateLimit('loan-apply', 3, 10 * 60 * 1000)
    if (!limit.allowed) {
      setSubmitError(rateLimitMessage(limit.retryAfterMs))
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    if (!user?.id) {
      setSubmitError(t('apply.error.signInRequired'))
      setSubmitting(false)
      return
    }

    const identity = await checkIdentityForLoanApplication({
      email: sanitizeText(data.email).toLowerCase(),
      phone: sanitizeText(data.phone),
      idNumber: sanitizeText(data.idNumber),
      idType: data.idType,
      userId: user.id,
      accountEmail: user.email,
      accountPhone: profile?.phone,
    })

    let duplicateFound = false
    if (identity.emailTaken) {
      setError('email', { message: t('validation.email.taken') })
      duplicateFound = true
    }
    if (identity.phoneTaken) {
      setError('phone', { message: t('validation.phone.taken') })
      duplicateFound = true
    }
    if (identity.idNumberTaken) {
      setError('idNumber', { message: t('validation.idNumber.taken') })
      duplicateFound = true
    }
    if (duplicateFound) {
      setSubmitting(false)
      return
    }

    try {
      const fileExt = idFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('id-documents')
        .upload(filePath, idFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageContentType(idFile),
        })

      if (uploadError) throw uploadError

      const payout = toDisbursementDbFields(data)

      const { error: insertError } = await supabase.from('loan_requests').insert({
        user_id: user.id,
        full_name: sanitizeText(data.fullName),
        email: sanitizeText(data.email).toLowerCase(),
        phone: normalizeBotswanaPhone(sanitizeText(data.phone)),
        id_number: sanitizeText(data.idNumber),
        id_type: data.idType,
        id_photo_path: filePath,
        physical_address: sanitizeText(data.physicalAddress),
        loan_amount: Math.round(data.loanAmount),
        loan_purpose: sanitizeText(data.loanPurpose),
        term_months: data.termMonths,
        employment_status:
          data.employmentStatus === 'other' && data.employmentOther
            ? sanitizeText(data.employmentOther)
            : data.employmentStatus,
        monthly_income: data.monthlyIncome ?? null,
        ...payout,
        status: 'reviewing',
        source: 'website',
      })

      if (insertError) throw insertError

      setSuccess(true)
      setIdFile(null)
      setIdPreview(null)
    } catch (err) {
      setSubmitError(formatSupabaseError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <>
        <PageHero
          title={t('apply.success.hero.title')}
          subtitle={t('apply.success.hero.subtitle')}
        />
        <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <CheckCircle className="mx-auto h-16 w-16 text-growth-500" />
            <h2 className="mt-6 text-2xl font-bold text-brand-900">{t('apply.success.title')}</h2>
            <p className="mt-3 text-brand-600">{t('apply.success.body')}</p>
            <div className="mt-8 flex justify-center gap-4">
              {user ? (
                <a href="#/dashboard">
                  <Button>{t('apply.success.dashboard')}</Button>
                </a>
              ) : (
                <a href="#/register">
                  <Button>{t('apply.success.createAccount')}</Button>
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
        <PageHero
          title={t('apply.hero.title')}
          subtitle={t('apply.checking.subtitle')}
          titleKey="apply.hero.title"
          subtitleKey="apply.hero.subtitle"
        />
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <div className="skeleton h-40 rounded-2xl" />
        </div>
      </>
    )
  }

  if (activeLoan) {
    const balance = getOutstandingBalance(activeLoan)

    return (
      <>
        <PageHero
          title={t('apply.active.title')}
          subtitle={t('apply.active.subtitle')}
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
                    {formatPula(activeLoan.loan_amount)}
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
                    <dt className="text-brand-500">{t('apply.active.totalRepayable')}</dt>
                    <dd className="font-semibold text-brand-900">
                      {formatPula(activeLoan.total_repayable)}
                    </dd>
                  </div>
                )}
                {balance != null && (
                  <div className="rounded-xl bg-brand-50 p-3">
                    <dt className="text-brand-500">{t('apply.active.outstandingBalance')}</dt>
                    <dd className="font-semibold text-brand-900">{formatPula(balance)}</dd>
                  </div>
                )}
                {activeLoan.due_date && (
                  <div className="rounded-xl bg-brand-50 p-3">
                    <dt className="flex items-center gap-1 text-brand-500">
                      <Clock className="h-3.5 w-3.5" /> {t('apply.active.dueDate')}
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
                {t('apply.active.note')}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/dashboard">
                  <Button>{t('apply.active.viewDashboard')}</Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline">{t('apply.active.contactUs')}</Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </>
    )
  }

  const modeLabel = (key: 'apply.mode.website' | 'apply.mode.whatsapp') =>
    language === 'tn' ? (
      t(key)
    ) : (
      <EditableText as="span" contentKey={key}>
        {t(key)}
      </EditableText>
    )

  const sharedFormFields = (
    <>
      <Input
        label={t('apply.field.fullName')}
        required
        hint={t('apply.field.fullNameHint')}
        {...register('fullName')}
        error={errors.fullName?.message}
      />
      <Input
        label={t('apply.field.email')}
        type="email"
        required
        hint={t('apply.field.emailHint')}
        {...register('email')}
        error={errors.email?.message}
      />
      <PhoneInput
        label={t('apply.field.phone')}
        required
        hint={t('apply.field.phoneHint')}
        {...register('phone')}
        error={errors.phone?.message}
      />
      <Select
        label={t('apply.field.documentType')}
        options={idTypeOptions}
        required
        hint={t('apply.field.documentTypeHint')}
        {...register('idType')}
        error={errors.idType?.message}
      />
      <Input
        label={isPassport ? t('apply.field.passportNumber') : t('apply.field.idNumber')}
        required
        inputMode={isPassport ? 'text' : 'numeric'}
        hint={isPassport ? t('apply.field.passportHint') : t('apply.field.idNumberHint')}
        {...register('idNumber')}
        error={errors.idNumber?.message}
      />
      <Textarea
        label={t('apply.field.physicalAddress')}
        rows={3}
        required
        hint={t('apply.field.physicalAddressHint')}
        {...register('physicalAddress')}
        error={errors.physicalAddress?.message}
      />
      <Input
        label={t('apply.field.loanAmount')}
        type="number"
        required
        min={COMPANY.loanAmountMin}
        max={COMPANY.loanAmountMax}
        inputMode="numeric"
        hint={t('apply.field.loanAmountHint')}
        {...register('loanAmount', { valueAsNumber: true })}
        error={errors.loanAmount?.message}
      />
      <Select
        label={t('apply.field.repaymentPeriod')}
        options={termOptions}
        required
        hint={t('apply.field.repaymentPeriodHint')}
        {...register('termMonths', { valueAsNumber: true })}
        error={errors.termMonths?.message}
      />
      <Textarea
        label={t('apply.field.loanPurpose')}
        rows={3}
        required
        hint={t('apply.field.loanPurposeHint')}
        {...register('loanPurpose')}
        error={errors.loanPurpose?.message}
      />
      <Select
        label={t('apply.field.employmentStatus')}
        options={employmentOptions}
        required
        hint={t('apply.field.employmentStatusHint')}
        {...register('employmentStatus')}
        error={errors.employmentStatus?.message}
      />
      {isOtherEmployment && (
        <Input
          label={t('apply.field.employmentOther')}
          required
          hint={t('apply.field.employmentOtherHint')}
          {...register('employmentOther')}
          error={errors.employmentOther?.message}
        />
      )}
      <Input
        label={t('apply.field.monthlyIncome')}
        type="number"
        min={0}
        inputMode="numeric"
        hint={t('apply.field.monthlyIncomeHint')}
        {...register('monthlyIncome', {
          setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
        })}
        error={errors.monthlyIncome?.message}
      />
    </>
  )

  return (
    <>
      <PageHero
        title={t('apply.hero.title')}
        subtitle={t('apply.hero.subtitle')}
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
            <Globe className="h-4 w-4" /> {modeLabel('apply.mode.website')}
          </button>
          <button
            type="button"
            onClick={() => setMode('whatsapp')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              mode === 'whatsapp' ? 'bg-white text-brand-800 shadow-sm' : 'text-brand-600'
            }`}
          >
            <WhatsAppIcon className="h-4 w-4" /> {modeLabel('apply.mode.whatsapp')}
          </button>
        </div>

        {mode === 'whatsapp' ? (
          <Card>
            <h2 className="text-xl font-semibold text-brand-900">{t('apply.whatsapp.title')}</h2>
            <p className="mt-2 text-brand-600">{t('apply.whatsapp.intro')}</p>
            <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/70 p-3 text-sm text-brand-700">
              {t('apply.whatsapp.note')}
            </div>
            <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()} noValidate>
              {sharedFormFields}
              <DisbursementFields register={register} control={control} errors={errors} />
              <Button
                variant="whatsapp"
                className="w-full"
                type="button"
                onClick={handleSubmit(async (data) => {
                  if (!(await confirmHighBorrowingRisk(data))) return
                  window.open(buildWhatsAppLoanUrl(data), '_blank', 'noopener,noreferrer')
                })}
              >
                <WhatsAppIcon className="h-5 w-5" />
                {t('apply.submit.whatsapp')}
              </Button>
            </form>
          </Card>
        ) : (
          <Card>
            <h2 className="text-xl font-semibold text-brand-900">{t('apply.website.title')}</h2>
            <p className="mt-2 text-brand-600">{t('apply.website.intro')}</p>

            {submitError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{submitError}</p>
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmitWebsite)} noValidate>
              {sharedFormFields}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-brand-800">
                  {isPassport ? t('apply.field.passportPhoto') : t('apply.field.idPhoto')}{' '}
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
                      <p className="text-sm text-brand-600">{t('apply.field.idUploadHint')}</p>
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

              <DisbursementFields register={register} control={control} errors={errors} />

              <PrivacyConsentField
                register={register}
                error={errors.acceptPrivacy?.message}
                variant="loan"
              />

              <Button type="submit" className="w-full" loading={submitting}>
                {t('apply.submit.website')}
              </Button>
            </form>
          </Card>
        )}
        <div className="mx-auto mt-8 max-w-3xl px-4 sm:px-6">
          <RegulatoryNotice className="text-brand-500" />
        </div>
      </section>
    </>
  )
}
