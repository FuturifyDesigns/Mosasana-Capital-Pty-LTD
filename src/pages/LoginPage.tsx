import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { loginSchema, type LoginFormData } from '@/lib/validation'
import { PageHero } from '@/components/ui/PageHero'

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
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <>
      <PageHero title="Sign In" subtitle="Access your account to track loan applications." />
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
              <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                error={errors.password?.message}
              />
              <Button type="submit" className="w-full" loading={loading}>
                Sign In
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-brand-600">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-900">
                Register here
              </Link>
            </p>
          </Card>
        </motion.div>
      </section>
    </>
  )
}
