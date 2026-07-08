import { forwardRef, type InputHTMLAttributes } from 'react'
import { BOTSWANA_COUNTRY_CODE } from '@/lib/phone'

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  hint?: string
  required?: boolean
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, hint, className = '', id, required, ...props }, ref) => {
    const inputId = id || props.name
    const hintId = hint ? `${inputId}-hint` : undefined

    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-brand-800">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <div className="flex">
          <span
            className="inline-flex shrink-0 items-center rounded-l-xl border border-r-0 border-brand-200 bg-brand-50 px-3 text-sm font-semibold text-brand-700"
            aria-hidden
          >
            {BOTSWANA_COUNTRY_CODE}
          </span>
          <input
            ref={ref}
            id={inputId}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={8}
            required={required}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={hintId}
            placeholder="71234567"
            className={`min-w-0 flex-1 rounded-r-xl border bg-white px-4 py-3 text-brand-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60 ${
              error ? 'border-red-400' : 'border-brand-200'
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : (
          hint && (
            <p id={hintId} className="text-xs text-brand-400">
              {hint}
            </p>
          )
        )}
      </div>
    )
  },
)
PhoneInput.displayName = 'PhoneInput'
