import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { createLoginSchema, type LoginFormData } from '@/lib/validation'
import { formatSupabaseError } from '@/lib/supabaseErrors'
import { checkRateLimit, rateLimitMessage } from '@/lib/rateLimit'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthDivider, GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { useLanguage } from '@/context/LanguageContext'

const BASE = import.meta.env.BASE_URL

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const schema = useMemo(() => createLoginSchema(t), [t])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: LoginFormData) => {
    const limit = checkRateLimit('login', 8, 5 * 60 * 1000)
    if (!limit.allowed) {
      setError(rateLimitMessage(limit.retryAfterMs))
      return
    }

    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      const msg = formatSupabaseError(authError)
      setError(
        /invalid login credentials/i.test(msg) ? t('auth.login.invalidCredentials') : msg,
      )
      setLoading(false)
      return
    }

    const { data: authUser } = await supabase.auth.getUser()
    if (authUser.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('banned, role')
        .eq('id', authUser.user.id)
        .single()
      if (profile?.banned) {
        await supabase.auth.signOut()
        setError(t('auth.login.suspended'))
        setLoading(false)
        return
      }
    }

    navigate(from, { replace: true })
  }

  return (
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      image={`${BASE}auth-signin-thumb.png`}
      panelHeading={t('auth.login.panelHeading')}
      panelText={t('auth.login.panelText')}
      points={[t('auth.login.point1'), t('auth.login.point2'), t('auth.login.point3')]}
      footer={
        <>
          {t('auth.login.footer')}{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-900">
            {t('auth.login.footerLink')}
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
          label={t('auth.login.email')}
          type="email"
          required
          autoComplete="email"
          hint={t('auth.login.emailHint')}
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label={t('auth.login.password')}
          type="password"
          required
          autoComplete="current-password"
          {...register('password')}
          error={errors.password?.message}
        />
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-brand-600 transition hover:text-brand-900"
          >
            {t('auth.login.forgotPassword')}
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          {t('auth.login.submit')}
        </Button>
      </form>

      <AuthDivider />
      <GoogleSignInButton />
    </AuthLayout>
  )
}
