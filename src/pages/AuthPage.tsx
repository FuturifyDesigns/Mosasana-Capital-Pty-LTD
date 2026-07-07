import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, UserPlus, ArrowRight, Check } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { COMPANY } from '@/lib/constants'

const BASE = import.meta.env.BASE_URL

type Side = 'in' | 'up'

const panels = {
  in: {
    title: 'Sign In',
    tagline: 'Welcome back',
    to: '/login',
    image: `${BASE}consultation.png`,
    icon: LogIn,
    description: 'Access your account to submit new loan requests and track your applications.',
    points: ['Track application status', 'View your loan history', 'Pick up right where you left off'],
    gradient: 'from-brand-800/90 via-brand-700/85 to-brand-600/80',
  },
  up: {
    title: 'Create Account',
    tagline: 'New to Mosasana?',
    to: '/register',
    image: `${BASE}hero-money.png`,
    icon: UserPlus,
    description: 'Register in minutes to apply for short-term cash loans on our secure platform.',
    points: ['Quick, secure sign-up', 'Apply on web or WhatsApp', 'Verified by email'],
    gradient: 'from-brand-900/90 via-brand-800/85 to-brand-700/80',
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

      <div className="flex flex-col gap-4 md:h-[26rem] md:flex-row md:gap-0">
        {(Object.keys(panels) as Side[]).map((side, index) => {
          const p = panels[side]
          const Icon = p.icon
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
              className={`group relative flex h-64 flex-1 basis-0 overflow-hidden text-left text-white shadow-xl outline-none transition-[flex-grow] duration-500 ease-out focus-visible:ring-4 focus-visible:ring-brand-300 md:h-full ${
                side === 'in'
                  ? 'rounded-3xl md:rounded-l-3xl md:rounded-r-none'
                  : 'rounded-3xl md:rounded-l-none md:rounded-r-3xl'
              }`}
            >
              {/* background image */}
              <img
                src={p.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient}`} />

              {/* content */}
              <div className="relative z-10 flex h-full w-full flex-col justify-between p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25 transition-transform duration-500 group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-medium uppercase tracking-widest text-white/80">
                    {p.tagline}
                  </span>
                </div>

                <div>
                  <h2 className="font-display text-3xl font-bold sm:text-4xl">{p.title}</h2>

                  {/* revealed info: always visible on mobile, on hover for desktop */}
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-out md:max-h-0 md:opacity-0 ${
                      active ? 'md:max-h-56 md:opacity-100' : ''
                    }`}
                  >
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">
                      {p.description}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {p.points.map((point) => (
                        <li key={point} className="flex items-center gap-2 text-sm text-white/90">
                          <Check className="h-4 w-4 shrink-0 text-gold-300" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 shadow-lg transition-all duration-300 group-hover:gap-3">
                    {side === 'in' ? 'Sign in' : 'Get started'}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
