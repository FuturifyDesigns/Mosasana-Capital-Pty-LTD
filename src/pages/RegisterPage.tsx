import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { AlertCircle, Mail } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { registerSchema, sanitizeText, type RegisterFormData } from '@/lib/validation'
import { checkRateLimit, rateLimitMessage } from '@/lib/rateLimit'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Logo } from '@/components/Logo'

const BASE = import.meta.env.BASE_URL

export function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    const limit = checkRateLimit('register', 5, 10 * 60 * 1000)
    if (!limit.allowed) {
      setError(rateLimitMessage(limit.retryAfterMs))
      return
    }

    setLoading(true)
    setError(null)

    // Block duplicate phone numbers (one account per phone number)
    const { data: phoneTaken, error: phoneErr } = await supabase.rpc('phone_taken', {
      p_phone: sanitizeText(data.phone),
    })
    if (!phoneErr && phoneTaken) {
      setError('This phone number is already registered. Please sign in or use a different number.')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: sanitizeText(data.fullName),
          phone: sanitizeText(data.phone),
        },
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}?verified=1`,
      },
    })

    if (authError) {
      const msg = authError.message || ''
      const friendly = /phone|duplicate|unique/i.test(msg)
        ? 'This phone number is already registered. Please sign in or use a different number.'
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
      <section className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl border border-brand-100 bg-white p-8 shadow-2xl"
        >
          <div className="flex justify-center">
            <Logo className="h-20" />
          </div>
          <Mail className="mx-auto mt-8 h-16 w-16 text-brand-500" />
          <h2 className="mt-6 font-display text-2xl font-bold text-brand-900">Verify Your Email</h2>
          <p className="mt-3 text-brand-600">
            Please check your inbox and click the verification link to activate your account. Once
            verified, you can sign in and submit loan applications.
          </p>
          <Link to="/login" className="mt-8 inline-block">
            <Button>Go to Sign In</Button>
          </Link>
        </motion.div>
      </section>
    )
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Register to apply for loans and track your applications."
      image={`${BASE}auth-signup.png`}
      panelHeading="A loan is just a message away"
      panelText="Join Mosasana Capital and get access to fast, secure short-term cash loans — on the web or WhatsApp."
      points={['Quick, secure sign-up', 'Apply on web or WhatsApp', 'Verified by email']}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-900">
            Sign in here
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
          label="Full Name"
          required
          hint="Letters only — as it appears on your ID (no numbers)."
          {...register('fullName')}
          error={errors.fullName?.message}
        />
        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          hint="We'll send a verification link to this address."
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Phone"
          required
          type="tel"
          inputMode="tel"
          hint="Botswana number, 8 digits (e.g. 71234567)."
          {...register('phone')}
          error={errors.phone?.message}
        />
        <Input
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          hint="At least 8 characters with an uppercase, lowercase and a number."
          {...register('password')}
          error={errors.password?.message}
        />
        <Input
          label="Confirm Password"
          type="password"
          required
          autoComplete="new-password"
          hint="Re-enter your password to confirm."
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />
        <Button type="submit" className="w-full" loading={loading}>
          Create Account
        </Button>
      </form>
    </AuthLayout>
  )
}
