import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, ShieldCheck, Lock, KeyRound } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'
import { supabase } from '@/lib/supabase'
import { createResetPasswordSchema, type ResetPasswordFormData } from '@/lib/validation'
import { useLanguage } from '@/context/LanguageContext'
import type { TranslationKey } from '@/lib/i18n'

const checks: { key: TranslationKey; test: (v: string) => boolean }[] = [
  { key: 'auth.reset.check.length', test: (v) => v.length >= 8 },
  { key: 'auth.reset.check.upper', test: (v) => /[A-Z]/.test(v) },
  { key: 'auth.reset.check.lower', test: (v) => /[a-z]/.test(v) },
  { key: 'auth.reset.check.number', test: (v) => /[0-9]/.test(v) },
]

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session))
  }, [])

  const schema = useMemo(() => createResetPasswordSchema(t), [t])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(schema),
  })

  const passwordValue = watch('password') || ''

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100 px-4 py-16">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-brand-300/30 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        className="relative z-10 w-full max-w-md rounded-[28px] border border-white/60 bg-white/85 p-8 shadow-2xl backdrop-blur-xl sm:p-10"
      >
        <div className="flex justify-center">
          <Logo className="h-24 sm:h-28" />
        </div>

        {done ? (
          <div className="mt-8 text-center">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <motion.span
                className="absolute h-20 w-20 rounded-full bg-growth-500/15"
                animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-growth-500 to-growth-600 shadow-lg shadow-growth-500/30">
                <CheckCircle2 className="h-9 w-9 text-white" />
              </span>
            </div>
            <h1 className="mt-6 font-display text-2xl font-bold text-brand-900">
              {t('auth.reset.done.title')}
            </h1>
            <p className="mt-3 text-brand-600">{t('auth.reset.done.body')}</p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex justify-center">
              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 12 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30"
              >
                <KeyRound className="h-7 w-7" />
              </motion.span>
            </div>
            <h1 className="mt-5 text-center font-display text-2xl font-bold text-brand-900">
              {t('auth.reset.title')}
            </h1>
            <p className="mt-2 text-center text-sm text-brand-600">{t('auth.reset.subtitle')}</p>

            {!ready && (
              <div className="mt-6 flex items-start gap-2 rounded-xl bg-brand-50 p-4 text-sm text-brand-600">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <span>{t('auth.reset.linkRequired')}</span>
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
                label={t('auth.reset.newPassword')}
                type="password"
                required
                autoComplete="new-password"
                {...register('password')}
                error={errors.password?.message}
              />

              {passwordValue.length > 0 && (
                <ul className="grid grid-cols-2 gap-1.5 rounded-xl bg-brand-50/70 p-3">
                  {checks.map((c) => {
                    const ok = c.test(passwordValue)
                    return (
                      <li
                        key={c.key}
                        className={`flex items-center gap-1.5 text-xs transition ${
                          ok ? 'text-growth-600' : 'text-brand-400'
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                            ok ? 'bg-growth-500 text-white' : 'bg-brand-200 text-white'
                          }`}
                        >
                          <Lock className="h-2.5 w-2.5" />
                        </span>
                        {t(c.key)}
                      </li>
                    )
                  })}
                </ul>
              )}

              <Input
                label={t('auth.reset.confirmPassword')}
                type="password"
                required
                autoComplete="new-password"
                hint={t('auth.reset.confirmPasswordHint')}
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />
              <Button type="submit" className="w-full" loading={loading} disabled={!ready}>
                {t('auth.reset.submit')}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </main>
  )
}
