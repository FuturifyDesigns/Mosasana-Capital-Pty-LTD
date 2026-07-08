import { Link } from 'react-router-dom'
import { Mail, Phone, ArrowUpRight } from 'lucide-react'
import { BotswanaFlag } from './icons/BotswanaFlag'
import { RegulatoryNotice } from '@/components/RegulatoryNotice'
import { COMPANY } from '@/lib/constants'

export function Footer() {
  const year = new Date().getFullYear()

  const officers = [
    { role: 'Principal Officer', ...COMPANY.principalOfficer },
    { role: 'Compliance Officer', ...COMPANY.complianceOfficer },
  ]

  const exploreLinks = [
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact Us' },
    { to: '/login', label: 'Client Login' },
    { to: '/register', label: 'Create Account' },
    { to: '/terms', label: 'Terms' },
    { to: '/privacy', label: 'Privacy' },
  ]

  return (
    <footer className="relative mt-auto bg-gradient-to-b from-brand-800 to-brand-900 text-brand-100 max-sm:pb-[calc(var(--footer-bottom-pad)+env(safe-area-inset-bottom))]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Mobile — compact stacked layout */}
        <div className="space-y-5 sm:hidden">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}logo-transparent.png`}
              alt={COMPANY.name}
              loading="lazy"
              decoding="async"
              className="h-14 w-auto shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-white">{COMPANY.shortName}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-brand-300">{COMPANY.tagline}</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-brand-700/60 bg-brand-800/50 px-3 py-1 text-[11px] font-semibold text-brand-100">
            <BotswanaFlag className="h-3 w-4 rounded-sm ring-1 ring-black/10" />
            Proudly Botswana
          </div>

          <div className="grid grid-cols-2 gap-2">
            {officers.map((officer) => (
              <div
                key={officer.email}
                className="min-w-0 rounded-xl border border-brand-700/50 bg-brand-800/40 p-3"
              >
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gold-400">
                  {officer.role.replace(' Officer', '')}
                </h3>
                <p className="mt-1 text-xs font-semibold leading-tight text-white">{officer.name}</p>
                <a
                  href={`tel:${officer.cell.replace(/\s/g, '')}`}
                  className="mt-1.5 flex items-center gap-1.5 text-[11px] text-brand-300"
                >
                  <Phone className="h-3 w-3 shrink-0 text-brand-400" />
                  <span className="truncate">{officer.cell}</span>
                </a>
              </div>
            ))}
          </div>

          <nav className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-brand-700/50 pt-4">
            {exploreLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg bg-brand-800/30 px-3 py-2 text-center text-xs font-medium text-brand-200 transition hover:bg-brand-700/40 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop — full grid */}
        <div className="hidden gap-8 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <img
              src={`${import.meta.env.BASE_URL}logo-transparent.png`}
              alt={COMPANY.name}
              loading="lazy"
              decoding="async"
              className="mb-3 h-24 w-auto"
            />
            <p className="max-w-xs text-sm leading-relaxed text-brand-300">{COMPANY.tagline}.</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-700/60 bg-brand-800/50 px-3 py-1.5 text-xs font-semibold text-brand-100">
              <BotswanaFlag className="h-3.5 w-5 rounded-sm ring-1 ring-black/10" />
              Proudly Botswana
            </div>
          </div>

          {officers.map((officer) => (
            <div
              key={officer.email}
              className="min-w-0 rounded-xl border border-brand-700/50 bg-brand-800/40 p-4"
            >
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gold-400">
                {officer.role}
              </h3>
              <p className="mt-1.5 font-semibold text-white">{officer.name}</p>
              <a
                href={`tel:${officer.cell.replace(/\s/g, '')}`}
                className="mt-2 flex items-center gap-2 text-sm text-brand-300 transition hover:text-white"
              >
                <Phone className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                <span className="truncate">{officer.cell}</span>
              </a>
              <a
                href={`mailto:${officer.email}`}
                className="mt-1 flex items-start gap-2 text-sm text-brand-300 transition hover:text-white"
              >
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
                <span className="break-all">{officer.email}</span>
              </a>
            </div>
          ))}

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gold-400">Explore</h3>
            <nav className="mt-1.5 flex flex-col gap-2 text-sm">
              {exploreLinks.map((link) => (
                <Link key={link.to} to={link.to} className="text-brand-300 transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-700/60 bg-brand-900/40 px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <RegulatoryNotice />
        </div>
      </div>

      <div className="border-t border-brand-700/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-3 text-center text-xs sm:flex-row sm:gap-2 sm:px-6 sm:py-4 sm:text-left sm:text-sm">
          <p className="text-brand-200">
            &copy; {year} {COMPANY.name}
            <span className="mt-0.5 block text-[11px] text-brand-400 sm:text-xs">
              {COMPANY.regulatorShort} {COMPANY.nbfiraLicense} · Reg. {COMPANY.companyRegistration} ·{' '}
              {COMPANY.location}, Botswana
            </span>
          </p>
          <a
            href={COMPANY.builtBy.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1 text-brand-200 transition hover:text-white"
          >
            Built by {COMPANY.builtBy.name}
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5" />
          </a>
        </div>
      </div>
    </footer>
  )
}
