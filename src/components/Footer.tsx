import { Link } from 'react-router-dom'
import { Mail, Phone, ArrowUpRight } from 'lucide-react'
import { COMPANY } from '@/lib/constants'

export function Footer() {
  const year = new Date().getFullYear()

  const officers = [
    { role: 'Principal Officer', ...COMPANY.principalOfficer },
    { role: 'Compliance Officer', ...COMPANY.complianceOfficer },
  ]

  return (
    <footer className="relative mt-auto bg-gradient-to-b from-brand-800 to-brand-900 text-brand-100">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <img
              src={`${import.meta.env.BASE_URL}logo-transparent.png`}
              alt={COMPANY.name}
              className="mb-4 h-16 w-auto"
            />
            <p className="max-w-xs text-sm leading-relaxed text-brand-300">{COMPANY.tagline}.</p>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold-400">
              Get in touch
            </h3>
            <div className="space-y-4">
              {officers.map((officer) => (
                <div
                  key={officer.email}
                  className="min-w-0 rounded-xl border border-brand-700/50 bg-brand-800/40 p-4"
                >
                  <p className="text-[11px] uppercase tracking-wider text-brand-400">{officer.role}</p>
                  <p className="mt-0.5 font-semibold text-white">{officer.name}</p>
                  <a
                    href={`tel:${officer.cell.replace(/\s/g, '')}`}
                    className="mt-2 flex items-center gap-2 text-sm text-brand-200 transition hover:text-white"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                    <span className="truncate">{officer.cell}</span>
                  </a>
                  <a
                    href={`mailto:${officer.email}`}
                    className="mt-1 flex items-center gap-2 text-sm text-brand-200 transition hover:text-white"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                    <span className="truncate">{officer.email}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="md:justify-self-end">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold-400">Explore</h3>
            <nav className="flex flex-col gap-2.5 text-sm">
              <Link to="/about" className="text-brand-200 transition hover:text-white">
                About Us
              </Link>
              <Link to="/contact" className="text-brand-200 transition hover:text-white">
                Contact Us
              </Link>
              <Link to="/login" className="text-brand-200 transition hover:text-white">
                Client Login
              </Link>
              <Link to="/register" className="text-brand-200 transition hover:text-white">
                Create Account
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-700/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-center text-sm text-brand-400 sm:flex-row sm:px-6 sm:text-left">
          <p>
            &copy; {year} <span className="text-brand-200">{COMPANY.name}</span>. All rights reserved.
          </p>
          <a
            href={COMPANY.builtBy.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 transition hover:text-white"
          >
            Built by
            <span className="bg-gradient-to-r from-gold-400 to-gold-500 bg-clip-text font-medium text-transparent">
              {COMPANY.builtBy.name}
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-gold-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </footer>
  )
}
