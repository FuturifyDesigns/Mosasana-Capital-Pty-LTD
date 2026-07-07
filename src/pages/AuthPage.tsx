import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { BotswanaFlag } from '@/components/icons/BotswanaFlag'
import { COMPANY } from '@/lib/constants'

const BASE = import.meta.env.BASE_URL

type Side = 'in' | 'up'

const panels = {
  in: {
    tagline: 'Welcome back',
    to: '/login',
    image: `${BASE}auth-signin-thumb.png`,
    description: 'Access your account to submit new loan requests and track your applications.',
    points: ['Track application status', 'View your loan history', 'Pick up where you left off'],
    cta: 'Sign in',
  },
  up: {
    tagline: 'New to Mosasana?',
    to: '/register',
    image: `${BASE}auth-signup-thumb.png`,
    description: 'Register in minutes to apply for short-term cash loans on our secure platform.',
    points: ['Quick, secure sign-up', 'Apply on web or WhatsApp', 'Verified by email'],
    cta: 'Get started',
  },
} as const

export function AuthPage() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<Side | null>(null)

  const flexGrow = (side: Side) => {
    if (hovered === null) return 1
    return hovered === side ? 1.9 : 0.75
  }

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      {/* soft blue/white wash behind the cards */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-10 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-brand-200/40 blur-[110px]" />
        <div className="absolute bottom-0 right-10 h-64 w-64 rounded-full bg-sky-200/40 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <div className="flex justify-center">
          <Logo className="h-14 sm:h-16" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-brand-900 sm:text-4xl">
          Welcome to {COMPANY.shortName}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-brand-600">
          Choose how you&apos;d like to continue. Hover to explore, click to get started.
        </p>
      </motion.div>

      <div className="flex flex-col gap-4 md:h-[28rem] md:flex-row md:gap-0">
        {(Object.keys(panels) as Side[]).map((side, index) => {
          const p = panels[side]
          const active = hovered === side
          return (
            <motion.button
              key={side}
              type="button"
              onClick={() => navigate(p.to)}
              onMouseEnter={() => setHovered(side)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(side)}
              onBlur={() => setHovered(null)}
              style={{ flexGrow: flexGrow(side) }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 + index * 0.1 }}
              className={`group relative flex h-72 flex-1 basis-0 overflow-hidden text-left text-white shadow-xl outline-none ring-1 ring-brand-100 transition-[flex-grow] duration-500 ease-out focus-visible:ring-4 focus-visible:ring-brand-400 md:h-full ${
                side === 'in'
                  ? 'rounded-3xl md:rounded-l-3xl md:rounded-r-none'
                  : 'rounded-3xl md:rounded-l-none md:rounded-r-3xl'
              }`}
            >
              <img
                src={p.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-900/35 to-transparent" />

              <div className="relative z-10 flex h-full w-full flex-col justify-end p-6 sm:p-8">
                <span className="text-sm font-semibold uppercase tracking-widest text-white/85">
                  {p.tagline}
                </span>

                <div
                  className={`overflow-hidden transition-all duration-500 ease-out md:max-h-0 md:opacity-0 ${
                    active ? 'md:max-h-56 md:opacity-100' : ''
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

      <div className="mt-8 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-4 py-2 text-sm font-medium text-brand-700 shadow-sm backdrop-blur-sm">
          <BotswanaFlag className="h-4 w-6 rounded-sm ring-1 ring-black/5" />
          Proudly Botswana
        </span>
      </div>
    </section>
  )
}
