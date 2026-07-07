import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/Logo'

interface AuthLayoutProps {
  title: string
  subtitle: string
  image: string
  panelHeading: string
  panelText: string
  points: string[]
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({
  title,
  subtitle,
  image,
  panelHeading,
  panelText,
  points,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <Link
        to="/account"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to options
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-2xl lg:grid-cols-2"
      >
        {/* Branding / image panel */}
        <div className="group relative hidden min-h-full overflow-hidden lg:block">
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-800/65 to-brand-700/45" />
          <div className="relative flex h-full flex-col justify-end p-8 text-white">
            <div>
              <h2 className="font-display text-3xl font-bold">{panelHeading}</h2>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/85">{panelText}</p>
              <ul className="mt-6 space-y-3">
                {points.map((point) => (
                  <li key={point} className="flex items-center gap-2.5 text-sm text-white/90">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                      <Check className="h-3.5 w-3.5 text-gold-400" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <ShieldCheck className="h-4 w-4" />
              Bank-grade security · your data stays private
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="p-6 sm:p-10">
          <div className="mb-6 lg:hidden">
            <Logo className="h-12" />
          </div>
          <h1 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-brand-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
          <div className="mt-6 border-t border-brand-100 pt-5 text-center text-sm text-brand-600">
            {footer}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
