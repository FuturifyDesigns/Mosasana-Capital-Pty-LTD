import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { AlertCircle, Mail } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { createRegisterSchema, sanitizeText, type RegisterFormData } from '@/lib/validation'
import { checkRateLimit, rateLimitMessage } from '@/lib/rateLimit'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthDivider, GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { Logo } from '@/components/Logo'
import { PrivacyConsentField } from '@/components/PrivacyConsentField'
import { checkIdentityAvailability } from '@/lib/identityChecks'
import { normalizeBotswanaPhone } from '@/lib/phone'
import { useLanguage } from '@/context/LanguageContext'

const BASE = import.meta.env.BASE_URL

export function RegisterPage() {
  const { t } = useLanguage()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const schema = useMemo(() => createRegisterSchema(t), [t])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
    defaultValues: { acceptTerms: false },
  })

  const onSubmit = async (data: RegisterFormData) => {
    const limit = checkRateLimit('register', 5, 10 * 60 * 1000)
    if (!limit.allowed) {
      setError(rateLimitMessage(limit.retryAfterMs))
      return
    }

    setLoading(true)
    setError(null)

    const identity = await checkIdentityAvailability({
      email: sanitizeText(data.email).toLowerCase(),
      phone: normalizeBotswanaPhone(sanitizeText(data.phone)),
    })

    if (identity.emailTaken) {
      setError(t('validation.email.taken'))
      setLoading(false)
      return
    }

    if (identity.phoneTaken) {
      setError(t('validation.phone.taken'))
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: sanitizeText(data.fullName),
          phone: normalizeBotswanaPhone(sanitizeText(data.phone)),
        },
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}?verified=1`,
      },
    })

    if (authError) {
      const msg = authError.message || ''
      const friendly = /email|already registered|user already/i.test(msg)
        ? t('validation.email.taken')
        : /phone|duplicate|unique/i.test(msg)
          ? t('validation.phone.taken')
          : msg
      setError(friendly)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <section className="page-zoom-out mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl border border-brand-100 bg-white p-8 shadow-2xl"
        >
          <div className="flex justify-center">
            <Logo className="h-20" />
          </div>
          <Mail className="mx-auto mt-8 h-16 w-16 text-brand-500" />
          <h2 className="mt-6 font-display text-2xl font-bold text-brand-900">
            {t('auth.register.success.title')}
          </h2>
          <p className="mt-3 text-brand-600">{t('auth.register.success.body')}</p>
          <Link to="/login" className="mt-8 inline-block">
            <Button>{t('auth.register.success.cta')}</Button>
          </Link>
        </motion.div>
      </section>
    )
  }

  return (
    <AuthLayout
      className="page-zoom-out"
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      image={`${BASE}auth-signup-thumb.png`}
      panelHeading={t('auth.register.panelHeading')}
      panelText={t('auth.register.panelText')}
      points={[t('auth.register.point1'), t('auth.register.point2'), t('auth.register.point3')]}
      footer={
        <>
          {t('auth.register.footer')}{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-900">
            {t('auth.register.footerLink')}
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label={t('auth.register.fullName')}
          required
          hint={t('auth.register.fullNameHint')}
          {...register('fullName')}
          error={errors.fullName?.message}
        />
        <Input
          label={t('auth.register.email')}
          type="email"
          required
          autoComplete="email"
          hint={t('auth.register.emailHint')}
          {...register('email')}
          error={errors.email?.message}
        />
        <PhoneInput
          label={t('auth.register.phone')}
          required
          hint={t('auth.register.phoneHint')}
          {...register('phone')}
          error={errors.phone?.message}
        />
        <Input
          label={t('auth.register.password')}
          type="password"
          required
          autoComplete="new-password"
          hint={t('auth.register.passwordHint')}
          {...register('password')}
          error={errors.password?.message}
        />
        <Input
          label={t('auth.register.confirmPassword')}
          type="password"
          required
          autoComplete="new-password"
          hint={t('auth.register.confirmPasswordHint')}
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />
        <PrivacyConsentField
          register={register}
          name="acceptTerms"
          error={errors.acceptTerms?.message}
          variant="register"
        />
        <Button type="submit" className="w-full" loading={loading}>
          {t('auth.register.submit')}
        </Button>
      </form>

      <AuthDivider />
      <GoogleSignInButton returnTo="/register" label={t('auth.register.google')} />
    </AuthLayout>
  )
}
