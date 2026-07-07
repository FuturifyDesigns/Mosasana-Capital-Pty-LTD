import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
  required?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, required, ...props }, ref) => {
    const textareaId = id || props.name
    const hintId = hint ? `${textareaId}-hint` : undefined
    return (
      <div className="space-y-1.5">
        <label htmlFor={textareaId} className="block text-sm font-medium text-brand-800">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={hintId}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-brand-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60 ${
            error ? 'border-red-400' : 'border-brand-200'
          } ${className}`}
          {...props}
        />
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
Textarea.displayName = 'Textarea'
