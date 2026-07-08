import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, LogIn, UserPlus } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { COMPANY } from '@/lib/constants'

const BASE = import.meta.env.BASE_URL

type Side = 'in' | 'up'

const panels = {
  in: {
    title: 'Sign in',
    tagline: 'Welcome back',
    to: '/login',
    image: `${BASE}auth-signin-thumb.png`,
    description: 'Access your account to submit new loan requests and track your applications.',
    points: ['Track application status', 'View your loan history', 'Pick up where you left off'],
    cta: 'Sign in',
    icon: LogIn,
  },
  up: {
    title: 'Sign up',
    tagline: 'New to Mosasana?',
    to: '/register',
    image: `${BASE}auth-signup-thumb.png`,
    description: 'Register in minutes to apply for short-term cash loans on our secure platform.',
    points: ['Quick, secure sign-up', 'Apply on web or WhatsApp', 'Verified by email'],
    cta: 'Create account',
    icon: UserPlus,
  },
} as const

export function AuthPage() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<Side | null>(null)

  const flexGrow = (side: Side) => {
    if (hovered === null) return 1
    return hovered === side ? 1.9 : 0.75
  }

  const handleSelect = (side: Side) => {
    navigate(panels[side].to)
  }

  return (
    <section className="relative isolate overflow-x-clip px-4 py-10 pb-[calc(var(--footer-bottom-pad)+1.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-12 lg:py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-gradient-to-b from-brand-50 via-white to-brand-50/60">
        <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-brand-100/60 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center sm:mb-10"
        >
          <div className="flex justify-center">
            <span className="rounded-3xl bg-white/85 p-3 shadow-lg ring-1 ring-brand-100 backdrop-blur-sm">
              <Logo className="h-16 sm:h-24" />
            </span>
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-brand-900 sm:mt-6 sm:text-4xl">
            Welcome to {COMPANY.shortName}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium text-brand-700 sm:text-base">
            <span className="md:hidden">Choose sign in or create a new account to continue.</span>
            <span className="hidden md:inline">
              Choose how you&apos;d like to continue. Hover to explore, click to get started.
            </span>
          </p>
        </motion.div>

        {/* Mobile — clear sign-in / sign-up cards */}
        <div className="grid gap-4 md:hidden">
          {(Object.keys(panels) as Side[]).map((side, index) => {
            const p = panels[side]
            const Icon = p.icon
            return (
              <motion.div
                key={side}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 + index * 0.08 }}
                className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-lg"
              >
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={p.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/35 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
                      {p.tagline}
                    </span>
                    <h2 className="mt-1 font-display text-xl font-bold text-white">{p.title}</h2>
                  </div>
                </div>
                <div className="space-y-4 p-4">
                  <p className="text-sm leading-relaxed text-brand-600">{p.description}</p>
                  <ul className="space-y-2">
                    {p.points.map((point) => (
                      <li key={point} className="flex items-center gap-2 text-sm text-brand-700">
                        <Check className="h-4 w-4 shrink-0 text-growth-500" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Link to={p.to} className="block">
                    <Button className="w-full" size="lg">
                      <Icon className="h-5 w-5" />
                      {p.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Desktop — interactive split panels */}
        <div className="hidden gap-4 md:flex md:h-[28rem] md:flex-row">
          {(Object.keys(panels) as Side[]).map((side, index) => {
            const p = panels[side]
            const active = hovered === side
            return (
              <motion.button
                key={side}
                type="button"
                onClick={() => handleSelect(side)}
                onMouseEnter={() => setHovered(side)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(side)}
                onBlur={() => setHovered(null)}
                style={{ flexGrow: flexGrow(side) }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 + index * 0.1 }}
                className="group relative flex h-full flex-1 basis-0 overflow-hidden rounded-3xl text-left text-white shadow-2xl outline-none ring-1 ring-white/40 transition-[flex-grow] duration-500 ease-out focus-visible:ring-4 focus-visible:ring-white"
              >
                <img
                  src={p.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-900/35 to-transparent" />

                <div className="relative z-10 flex h-full w-full flex-col justify-end p-6 sm:p-8">
                  <span className="text-sm font-semibold uppercase tracking-widest text-white/85">
                    {p.tagline}
                  </span>
                  <h2 className="mt-1 font-display text-2xl font-bold">{p.title}</h2>

                  <div
                    className={`overflow-hidden transition-all duration-500 ease-out ${
                      active ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/90">
                      {p.description}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {p.points.map((point) => (
                        <li key={point} className="flex items-center gap-2 text-sm text-white/90">
                          <Check className="h-4 w-4 shrink-0 text-gold-400" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 shadow-lg transition-all duration-300 group-hover:gap-3">
                    {p.cta}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </motion.button>
            )
          })}
        </div>

        <p className="mt-6 text-center text-sm text-brand-600 md:hidden">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
            Sign in
          </Link>
          {' · '}
          <Link to="/register" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </section>
  )
}
