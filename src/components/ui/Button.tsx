import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'whatsapp' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-600/20',
  secondary: 'bg-brand-100 text-brand-800 hover:bg-brand-200',
  outline: 'border-2 border-brand-300 text-brand-700 hover:bg-brand-50',
  ghost: 'text-brand-700 hover:bg-brand-100',
  whatsapp: 'bg-[#25D366] text-white hover:bg-[#1da851] shadow-md shadow-green-600/20',
  gold: 'bg-gold-500 text-white hover:bg-gold-600 shadow-md shadow-gold-500/20',
}

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
