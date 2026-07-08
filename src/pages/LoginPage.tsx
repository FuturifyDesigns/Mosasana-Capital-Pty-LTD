import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { loginSchema, type LoginFormData } from '@/lib/validation'
import { formatSupabaseError } from '@/lib/supabaseErrors'
import { checkRateLimit, rateLimitMessage } from '@/lib/rateLimit'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthDivider, GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

const BASE = import.meta.env.BASE_URL

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
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
        /invalid login credentials/i.test(msg)
          ? 'Incorrect email or password. If you just registered, confirm your email first.'
          : msg,
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
        setError('Your account has been suspended. Please contact support.')
        setLoading(false)
        return
      }
    }

    navigate(from, { replace: true })
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to submit loan requests and track your applications."
      image={`${BASE}auth-signin.png`}
      panelHeading="Good to see you again"
      panelText="Pick up right where you left off and manage all your loan applications in one secure place."
      points={['Track application status', 'View your loan history', 'Apply again in a few clicks']}
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-900">
            Register here
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
          label="Email"
          type="email"
          required
          autoComplete="email"
          hint="The email address you registered with."
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Password"
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
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Sign In
        </Button>
      </form>

      <AuthDivider />
      <GoogleSignInButton />
    </AuthLayout>
  )
}
