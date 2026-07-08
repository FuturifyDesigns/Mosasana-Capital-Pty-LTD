import { Link } from 'react-router-dom'
import { Mail, Phone, ArrowUpRight } from 'lucide-react'
import { BotswanaFlag } from './icons/BotswanaFlag'
import { COMPANY } from '@/lib/constants'

export function Footer() {
  const year = new Date().getFullYear()

  const officers = [
    { role: 'Principal Officer', ...COMPANY.principalOfficer },
    { role: 'Compliance Officer', ...COMPANY.complianceOfficer },
  ]

  return (
    <footer className="relative mt-auto bg-gradient-to-b from-brand-800 to-brand-900 text-brand-100 max-sm:pb-[calc(var(--footer-bottom-pad)+env(safe-area-inset-bottom))]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <img
              src={`${import.meta.env.BASE_URL}logo-transparent.png`}
              alt={COMPANY.name}
              loading="lazy"
              decoding="async"
              className="mb-3 h-20 w-auto sm:h-24"
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
              <Link to="/about" className="text-brand-300 transition hover:text-white">
                About Us
              </Link>
              <Link to="/contact" className="text-brand-300 transition hover:text-white">
                Contact Us
              </Link>
              <Link to="/login" className="text-brand-300 transition hover:text-white">
                Client Login
              </Link>
              <Link to="/register" className="text-brand-300 transition hover:text-white">
                Create Account
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-700/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-center text-sm sm:flex-row sm:gap-2 sm:px-6 sm:py-4 sm:text-left">
          <p className="text-brand-200">
            &copy; {year} {COMPANY.name}. All rights reserved.
            <span className="mt-0.5 block text-xs text-brand-400">
              Licensed by {COMPANY.regulatorShort} ({COMPANY.licensedYear}) · {COMPANY.location},
              Botswana
            </span>
          </p>
          <a
            href={COMPANY.builtBy.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 text-brand-200 transition hover:text-white"
          >
            Built by {COMPANY.builtBy.name}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </footer>
  )
}
