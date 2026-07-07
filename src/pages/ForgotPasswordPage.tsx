import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { AlertCircle, MailCheck, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'
import { supabase } from '@/lib/supabase'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validation'

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true)
    setError(null)
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      data.email.trim().toLowerCase(),
      { redirectTo },
    )
    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-brand-100 bg-white p-8 shadow-2xl"
      >
        <div className="flex justify-center">
          <Logo className="h-12" />
        </div>

        {sent ? (
          <div className="mt-8 text-center">
            <MailCheck className="mx-auto h-16 w-16 text-brand-500" />
            <h1 className="mt-6 font-display text-2xl font-bold text-brand-900">Check your email</h1>
            <p className="mt-3 text-brand-600">
              If an account exists for that address, we&apos;ve sent a link to reset your password.
              Follow the link to choose a new password.
            </p>
            <Link to="/login" className="mt-8 inline-block">
              <Button>Back to Sign In</Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mt-6 text-center font-display text-2xl font-bold text-brand-900">
              Forgot your password?
            </h1>
            <p className="mt-2 text-center text-sm text-brand-600">
              Enter your email and we&apos;ll send you a link to reset it.
            </p>

            {error && (
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Input
                label="Email"
                type="email"
                required
                autoComplete="email"
                {...register('email')}
                error={errors.email?.message}
              />
              <Button type="submit" className="w-full" loading={loading}>
                Send reset link
              </Button>
            </form>

            <Link
              to="/login"
              className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </>
        )}
      </motion.div>
    </section>
  )
}
