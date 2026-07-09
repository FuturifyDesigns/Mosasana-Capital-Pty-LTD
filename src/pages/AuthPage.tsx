import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, LogIn, UserPlus } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { useLanguage } from '@/context/LanguageContext'
import { COMPANY } from '@/lib/constants'
import type { TranslationKey } from '@/lib/i18n'

const BASE = import.meta.env.BASE_URL

type Side = 'in' | 'up'

const panels = {
  in: {
    prefix: 'auth.panel.signIn',
    to: '/login',
    image: `${BASE}auth-signin.png`,
    icon: LogIn,
  },
  up: {
    prefix: 'auth.panel.signUp',
    to: '/register',
    image: `${BASE}auth-signup.png`,
    icon: UserPlus,
  },
} as const

function panelKey(prefix: string, suffix: string): TranslationKey {
  return `${prefix}.${suffix}` as TranslationKey
}

export function AuthPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [hovered, setHovered] = useState<Side | null>(null)

  const flexGrow = (side: Side) => {
    if (hovered === null) return 1
    return hovered === side ? 1.9 : 0.75
  }

  const handleSelect = (side: Side) => {
    navigate(panels[side].to)
  }

  const getPanel = (side: Side) => {
    const { prefix, to, image, icon } = panels[side]
    return {
      to,
      image,
      icon,
      title: t(panelKey(prefix, 'title')),
      tagline: t(panelKey(prefix, 'tagline')),
      description: t(panelKey(prefix, 'description')),
      points: [
        t(panelKey(prefix, 'point1')),
        t(panelKey(prefix, 'point2')),
        t(panelKey(prefix, 'point3')),
      ],
      cta: t(panelKey(prefix, 'cta')),
    }
  }

  return (
    <section className="relative isolate overflow-x-clip px-4 py-6 pb-[calc(var(--footer-bottom-pad)+1rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-12 lg:py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-gradient-to-b from-brand-50 via-white to-brand-50/60">
        <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-brand-100/60 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 text-center sm:mb-10"
        >
          <div className="flex justify-center">
            <span className="rounded-2xl bg-white/85 p-2 shadow-lg ring-1 ring-brand-100 backdrop-blur-sm sm:rounded-3xl sm:p-3">
              <Logo className="h-12 sm:h-24" />
            </span>
          </div>
          <h1 className="mt-3 font-display text-xl font-bold text-brand-900 sm:mt-6 sm:text-4xl">
            {t('auth.welcome.title', { company: COMPANY.shortName })}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-brand-600 sm:mt-3 sm:text-base">
            <span className="md:hidden">{t('auth.welcome.subtitleMobile')}</span>
            <span className="hidden md:inline">{t('auth.welcome.subtitleDesktop')}</span>
          </p>
        </motion.div>

        {/* Mobile — compact cards */}
        <div className="grid gap-3 md:hidden">
          {(Object.keys(panels) as Side[]).map((side, index) => {
            const p = getPanel(side)
            const Icon = p.icon
            return (
              <motion.div
                key={side}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 + index * 0.06 }}
                className="overflow-hidden rounded-xl border border-brand-100 bg-white shadow-md"
              >
                <div className="flex items-stretch">
                  <div className="relative w-24 shrink-0 overflow-hidden sm:w-28">
                    <OptimizedImage
                      src={p.image}
                      alt=""
                      aria-hidden="true"
                      className="h-full min-h-[5.5rem] w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-brand-900/25" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-500">
                        {p.tagline}
                      </span>
                      <h2 className="font-display text-base font-bold text-brand-900">{p.title}</h2>
                      <p className="mt-0.5 text-xs leading-snug text-brand-600">{p.description}</p>
                    </div>
                    <Link to={p.to} className="block">
                      <Button className="h-9 w-full text-sm" size="sm">
                        <Icon className="h-4 w-4" />
                        {p.cta}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Desktop — interactive split panels */}
        <div className="hidden gap-4 md:flex md:h-[28rem] md:flex-row">
          {(Object.keys(panels) as Side[]).map((side, index) => {
            const p = getPanel(side)
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
                <OptimizedImage
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
      </div>
    </section>
  )
}
