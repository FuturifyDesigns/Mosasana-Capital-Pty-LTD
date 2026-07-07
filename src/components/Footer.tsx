import { Link } from 'react-router-dom'
import { Mail, Phone, ArrowUpRight, ShieldCheck, MessageCircle } from 'lucide-react'
import { COMPANY } from '@/lib/constants'
import { FlagStrands } from './FlagStrands'
import { buildWhatsAppGeneralUrl } from '@/lib/whatsapp'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-auto overflow-hidden bg-gradient-to-b from-brand-800 via-brand-900 to-brand-900 text-brand-100">
      <FlagStrands variant="dark" className="opacity-40" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <img
              src={`${import.meta.env.BASE_URL}logo-transparent.png`}
              alt={COMPANY.name}
              className="mb-5 h-20 w-auto"
            />
            <p className="max-w-xs text-sm leading-relaxed text-brand-200">
              {COMPANY.mission}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand-700/60 bg-brand-800/40 px-4 py-2 text-xs font-medium text-brand-100">
              <ShieldCheck className="h-4 w-4 text-gold-400" />
              Secure &amp; confidential lending
            </div>
          </div>

          <div className="lg:col-span-5">
            <h3 className="mb-5 font-display text-sm font-semibold uppercase tracking-widest text-gold-400">
              Get in touch
            </h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-brand-700/50 bg-brand-800/30 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wider text-brand-400">Principal Officer</p>
                <p className="mt-1 font-semibold text-white">{COMPANY.principalOfficer.name}</p>
                <a
                  href={`tel:${COMPANY.principalOfficer.cell}`}
                  className="mt-3 flex items-center gap-2 text-sm text-brand-200 transition hover:text-white"
                >
                  <Phone className="h-3.5 w-3.5 text-brand-400" /> {COMPANY.principalOfficer.cell}
                </a>
                <a
                  href={`mailto:${COMPANY.principalOfficer.email}`}
                  className="mt-1.5 flex items-center gap-2 text-sm text-brand-200 transition hover:text-white"
                >
                  <Mail className="h-3.5 w-3.5 text-brand-400" /> {COMPANY.principalOfficer.email}
                </a>
              </div>

              <div className="rounded-2xl border border-brand-700/50 bg-brand-800/30 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wider text-brand-400">Compliance Officer</p>
                <p className="mt-1 font-semibold text-white">{COMPANY.complianceOfficer.name}</p>
                <a
                  href={`tel:${COMPANY.complianceOfficer.cell}`}
                  className="mt-3 flex items-center gap-2 text-sm text-brand-200 transition hover:text-white"
                >
                  <Phone className="h-3.5 w-3.5 text-brand-400" /> {COMPANY.complianceOfficer.cell}
                </a>
                <a
                  href={`mailto:${COMPANY.complianceOfficer.email}`}
                  className="mt-1.5 flex items-center gap-2 text-sm text-brand-200 transition hover:text-white"
                >
                  <Mail className="h-3.5 w-3.5 text-brand-400" /> {COMPANY.complianceOfficer.email}
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h3 className="mb-5 font-display text-sm font-semibold uppercase tracking-widest text-gold-400">
              Explore
            </h3>
            <div className="flex flex-col gap-3 text-sm">
              {[
                { to: '/apply', label: 'Apply for a Loan' },
                { to: '/about', label: 'About Us' },
                { to: '/contact', label: 'Contact Us' },
                { to: '/login', label: 'Client Login' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group flex items-center gap-1.5 text-brand-200 transition hover:text-white"
                >
                  <span className="h-px w-4 bg-brand-600 transition-all duration-300 group-hover:w-6 group-hover:bg-gold-400" />
                  {link.label}
                </Link>
              ))}
            </div>

            <a
              href={buildWhatsAppGeneralUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-900/30 transition hover:bg-[#1da851]"
            >
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="relative border-t border-brand-700/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-center text-sm text-brand-300 sm:flex-row sm:px-6 sm:text-left">
          <p>
            &copy; {year} <span className="font-medium text-brand-100">{COMPANY.name}</span>. All rights reserved.
          </p>
          <a
            href={COMPANY.builtBy.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 font-medium text-brand-200 transition hover:text-white"
          >
            Built by
            <span className="bg-gradient-to-r from-gold-400 to-gold-500 bg-clip-text text-transparent">
              {COMPANY.builtBy.name}
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-gold-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </footer>
  )
}
