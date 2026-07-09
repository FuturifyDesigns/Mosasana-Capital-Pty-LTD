import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { FieldValues, Path, UseFormRegister } from 'react-hook-form'
import { useLanguage } from '@/context/LanguageContext'
import { COMPANY } from '@/lib/constants'

interface PrivacyConsentFieldProps<T extends FieldValues> {
  register: UseFormRegister<T>
  name?: Path<T>
  error?: string
  /** Shorter label for contact-style forms */
  variant?: 'loan' | 'contact' | 'register'
}

function ConsentText({
  template,
  privacyLabel,
  termsLabel,
}: {
  template: string
  privacyLabel: string
  termsLabel: string
}) {
  const parts = template.split(/\{(privacy|terms|company|act|range|termRange)\}/g)
  const values: Record<string, ReactNode> = {
    company: COMPANY.shortName,
    act: COMPANY.dataProtection.actReference,
    range: COMPANY.loanAmountRangeLabel,
    termRange: COMPANY.loanTermRange,
    privacy: (
      <Link
        key="privacy"
        to="/privacy"
        className="font-semibold text-brand-800 underline-offset-2 hover:underline"
      >
        {privacyLabel}
      </Link>
    ),
    terms: (
      <Link
        key="terms"
        to="/terms"
        className="font-semibold text-brand-800 underline-offset-2 hover:underline"
      >
        {termsLabel}
      </Link>
    ),
  }

  return (
    <>
      {parts.map((part, i) =>
        values[part] !== undefined ? (
          <span key={`${part}-${i}`}>{values[part]}</span>
        ) : (
          part
        ),
      )}
    </>
  )
}

export function PrivacyConsentField<T extends FieldValues>({
  register,
  name = 'acceptPrivacy' as Path<T>,
  error,
  variant = 'loan',
}: PrivacyConsentFieldProps<T>) {
  const { t } = useLanguage()
  const privacyPolicy = t('common.privacyPolicy')
  const termsAndConditions = t('terms.hero.title')

  const templateKey =
    variant === 'contact'
      ? 'legal.consent.contact'
      : variant === 'register'
        ? 'legal.consent.register'
        : 'legal.consent.loan'

  const label = (
    <ConsentText
      template={t(templateKey)}
      privacyLabel={privacyPolicy}
      termsLabel={termsAndConditions}
    />
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
