import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, Mail } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { registerSchema, sanitizeText, type RegisterFormData } from '@/lib/validation'
import { PageHero } from '@/components/ui/PageHero'

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
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: sanitizeText(data.fullName),
          phone: sanitizeText(data.phone),
        },
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <>
        <PageHero title="Check Your Email" subtitle="We've sent you a verification link." />
        <div className="mx-auto max-w-md px-4 py-12 text-center sm:px-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Mail className="mx-auto h-16 w-16 text-brand-500" />
            <h2 className="mt-6 text-2xl font-bold text-brand-900">Verify Your Email</h2>
            <p className="mt-3 text-brand-600">
              Please check your inbox and click the verification link to activate your account.
              Once verified, you can sign in and submit loan applications.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-growth-600">
              <CheckCircle className="h-4 w-4" />
              Verification email sent via Brevo
            </div>
            <Link to="/login" className="mt-8 inline-block">
              <Button>Go to Sign In</Button>
            </Link>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHero title="Create Account" subtitle="Register to apply for loans and track your applications." />
      <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <Input label="Full Name" {...register('fullName')} error={errors.fullName?.message} />
              <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
              <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                error={errors.password?.message}
              />
              <Input
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />
              <Button type="submit" className="w-full" loading={loading}>
                Create Account
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-brand-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-900">
                Sign in here
              </Link>
            </p>
          </Card>
        </motion.div>
      </section>
    </>
  )
}
