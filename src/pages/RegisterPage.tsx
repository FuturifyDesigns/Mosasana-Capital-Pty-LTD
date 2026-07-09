import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { AlertCircle, Mail } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { registerSchema, sanitizeText, type RegisterFormData } from '@/lib/validation'
import { checkRateLimit, rateLimitMessage } from '@/lib/rateLimit'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthDivider, GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { Logo } from '@/components/Logo'
import { PrivacyConsentField } from '@/components/PrivacyConsentField'
import { normalizeBotswanaPhone } from '@/lib/phone'
import {
  DISBURSEMENT_PROVIDERS,
  getDisbursementKind,
  isMobileWalletProvider,
} from '@/lib/constants'

const BASE = import.meta.env.BASE_URL

const DISBURSEMENT_OPTIONS = DISBURSEMENT_PROVIDERS.map((p) => ({
  value: p.value,
  label: p.label,
}))

function walletNumberHint(provider: string | undefined): string {
  if (provider === 'orange-money') return 'Enter the 8-digit mobile number registered with Orange Money.'
  if (provider === 'myzaka') return 'Enter the 8-digit mobile number linked to your MyZaka wallet.'
  return 'Enter your bank account number (digits only).'
}

function walletNumberLabel(provider: string | undefined): string {
  if (provider === 'orange-money') return 'Orange Money Number'
  if (provider === 'myzaka') return 'MyZaka Mobile Number'
  return 'Bank Account Number'
}

export function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  })

  const disbursementProvider = useWatch({ control, name: 'disbursementProvider' })
  const isMobileWallet = isMobileWalletProvider(disbursementProvider)

  const onSubmit = async (data: RegisterFormData) => {
    const limit = checkRateLimit('register', 5, 10 * 60 * 1000)
    if (!limit.allowed) {
      setError(rateLimitMessage(limit.retryAfterMs))
      return
    }

    setLoading(true)
    setError(null)

    const { data: phoneTaken, error: phoneErr } = await supabase.rpc('phone_taken', {
      p_phone: normalizeBotswanaPhone(sanitizeText(data.phone)),
    })
    if (!phoneErr && phoneTaken) {
      setError('This phone number is already registered. Please sign in or use a different number.')
      setLoading(false)
      return
    }

    const mobile = isMobileWalletProvider(data.disbursementProvider)

    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: sanitizeText(data.fullName),
          phone: normalizeBotswanaPhone(sanitizeText(data.phone)),
          disbursement_type: getDisbursementKind(data.disbursementProvider),
          bank_name: data.disbursementProvider,
          bank_account_name: sanitizeText(data.bankAccountHolderName),
          bank_account_number: sanitizeText(data.bankAccountNumber),
          bank_branch_code: mobile ? '' : sanitizeText(data.bankBranchCode || ''),
          bank_branch_name: mobile ? '' : sanitizeText(data.bankBranchName || ''),
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
      className="page-zoom-out"
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
        <PhoneInput
          label="Phone"
          required
          hint="Enter your 8-digit mobile number after +267."
          {...register('phone')}
          error={errors.phone?.message}
        />
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
          <p className="mb-1 text-sm font-semibold text-brand-800">Loan disbursement details</p>
          <p className="mb-3 text-xs text-brand-500">
            Choose your bank, Orange Money, or MyZaka — wherever you want the loan paid to.
          </p>
          <div className="space-y-4">
            <Select
              label="Bank / Wallet"
              required
              hint="Banks and mobile money (Orange Money, MyZaka) are listed here."
              options={DISBURSEMENT_OPTIONS}
              {...register('disbursementProvider')}
              error={errors.disbursementProvider?.message}
            />
            <Input
              label="Name on Account"
              required
              hint="Your name as registered with this bank or wallet."
              {...register('bankAccountHolderName')}
              error={errors.bankAccountHolderName?.message}
            />
            <Input
              label={walletNumberLabel(disbursementProvider)}
              required
              inputMode="numeric"
              autoComplete="off"
              hint={walletNumberHint(disbursementProvider)}
              {...register('bankAccountNumber')}
              error={errors.bankAccountNumber?.message}
            />
            {!isMobileWallet && (
              <>
                <Input
                  label="Branch Code"
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  hint="Your bank branch code (3–6 digits)."
                  {...register('bankBranchCode')}
                  error={errors.bankBranchCode?.message}
                />
                <Input
                  label="Branch Name"
                  required
                  hint="The name of your bank branch."
                  {...register('bankBranchName')}
                  error={errors.bankBranchName?.message}
                />
              </>
            )}
          </div>
        </div>
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
        <PrivacyConsentField
          register={register}
          name="acceptTerms"
          error={errors.acceptTerms?.message}
          variant="register"
        />
        <Button type="submit" className="w-full" loading={loading}>
          Create Account
        </Button>
      </form>

      <AuthDivider />
      <GoogleSignInButton returnTo="/register" label="Sign up with Google" />
    </AuthLayout>
  )
}
