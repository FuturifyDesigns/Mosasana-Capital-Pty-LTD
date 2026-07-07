import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'
import { supabase } from '@/lib/supabase'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validation'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session))
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true)
    setError(null)
    const { error: updateError } = await supabase.auth.updateUser({ password: data.password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
    setTimeout(() => navigate('/dashboard', { replace: true }), 1800)
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

        {done ? (
          <div className="mt-8 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-growth-500" />
            <h1 className="mt-6 font-display text-2xl font-bold text-brand-900">Password updated</h1>
            <p className="mt-3 text-brand-600">
              Your password has been changed. Redirecting you to your dashboard…
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                <ShieldCheck className="h-6 w-6" />
              </span>
            </div>
            <h1 className="mt-4 text-center font-display text-2xl font-bold text-brand-900">
              Set a new password
            </h1>
            <p className="mt-2 text-center text-sm text-brand-600">
              Choose a strong password for your account.
            </p>

            {!ready && (
              <div className="mt-6 rounded-xl bg-brand-50 p-4 text-center text-sm text-brand-600">
                Open this page from the password-reset link in your email to continue.
              </div>
            )}

            {error && (
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Input
                label="New Password"
                type="password"
                required
                autoComplete="new-password"
                hint="At least 8 characters with an uppercase, lowercase and a number."
                {...register('password')}
                error={errors.password?.message}
              />
              <Input
                label="Confirm New Password"
                type="password"
                required
                autoComplete="new-password"
                hint="Re-enter your new password to confirm."
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />
              <Button type="submit" className="w-full" loading={loading} disabled={!ready}>
                Update password
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </section>
  )
}
