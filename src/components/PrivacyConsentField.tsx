import { Link } from 'react-router-dom'
import type { FieldValues, Path, UseFormRegister } from 'react-hook-form'
import { COMPANY } from '@/lib/constants'

interface PrivacyConsentFieldProps<T extends FieldValues> {
  register: UseFormRegister<T>
  name?: Path<T>
  error?: string
  /** Shorter label for contact-style forms */
  variant?: 'loan' | 'contact' | 'register'
}

export function PrivacyConsentField<T extends FieldValues>({
  register,
  name = 'acceptPrivacy' as Path<T>,
  error,
  variant = 'loan',
}: PrivacyConsentFieldProps<T>) {
  const label =
    variant === 'contact' ? (
      <>
        I consent to {COMPANY.shortName} collecting and using my contact details to respond to this
        enquiry, as explained in the{' '}
        <Link to="/privacy" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
          Privacy Policy
        </Link>{' '}
        and in accordance with Botswana&apos;s {COMPANY.dataProtection.actReference}.
      </>
    ) : variant === 'register' ? (
      <>
        I agree to the{' '}
        <Link to="/terms" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
          Terms and Conditions
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
        .         I consent to the processing of my personal data as described, in accordance with
        Botswana&apos;s {COMPANY.dataProtection.actReference}. I understand that loans are from{' '}
        {COMPANY.loanAmountRangeLabel} with terms of {COMPANY.loanTermRange}.
      </>
    ) : (
      <>
        I have read the{' '}
        <Link to="/privacy" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
          Privacy Policy
        </Link>{' '}
        and consent to {COMPANY.shortName} collecting and processing my personal data — including
        sensitive data such as identification documents and financial information — for loan
        assessment, administration, and regulatory compliance under Botswana&apos;s{' '}
        {COMPANY.dataProtection.actReference}.
      </>
    )

  return (
    <div>
      <label className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3 text-sm text-brand-700">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
          {...register(name)}
        />
        <span>{label}</span>
      </label>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  )
}
