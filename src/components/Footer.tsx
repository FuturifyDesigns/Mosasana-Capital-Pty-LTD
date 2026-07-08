import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { BotswanaFlag } from './icons/BotswanaFlag'
import { RegulatoryNotice } from '@/components/RegulatoryNotice'
import { EditableText } from '@/components/editable/EditableText'
import { EditableOfficerCard } from '@/components/editable/EditableOfficerCard'
import { COMPANY } from '@/lib/constants'

export function Footer() {
  const year = new Date().getFullYear()

  const officers = [
    { role: 'Principal Officer', prefix: 'site.principal', defaults: COMPANY.principalOfficer },
    { role: 'Compliance Officer', prefix: 'site.compliance', defaults: COMPANY.complianceOfficer },
  ]

  const exploreLinks = [
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact Us' },
    { to: '/login', label: 'Client Login' },
    { to: '/register', label: 'Create Account' },
    { to: '/terms', label: 'Terms' },
    { to: '/privacy', label: 'Privacy' },
  ]

  const licenseLine = COMPANY.nbfiraLicense

  return (
    <footer className="relative mt-auto bg-gradient-to-b from-brand-800 to-brand-900 text-brand-100 max-sm:pb-[calc(var(--footer-bottom-pad)+env(safe-area-inset-bottom))]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
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
              <EditableText
                as="p"
                contentKey="site.tagline"
                className="mt-0.5 text-xs leading-relaxed text-brand-300"
              >
                {COMPANY.tagline}
              </EditableText>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-brand-700/60 bg-brand-800/50 px-3 py-1 text-[11px] font-semibold text-brand-100">
            <BotswanaFlag className="h-3 w-4 rounded-sm ring-1 ring-black/10" />
            <EditableText as="span" contentKey="site.footer.proudly">
              Proudly Botswana
            </EditableText>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {officers.map((officer) => (
              <EditableOfficerCard
                key={officer.prefix}
                role={officer.role}
                prefix={officer.prefix}
                defaults={officer.defaults}
                variant="footer"
              />
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

        <div className="hidden gap-8 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <img
              src={`${import.meta.env.BASE_URL}logo-transparent.png`}
              alt={COMPANY.name}
              loading="lazy"
              decoding="async"
              className="mb-3 h-24 w-auto"
            />
            <EditableText
              as="p"
              contentKey="site.tagline"
              className="max-w-xs text-sm leading-relaxed text-brand-300"
            >
              {`${COMPANY.tagline}.`}
            </EditableText>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-700/60 bg-brand-800/50 px-3 py-1.5 text-xs font-semibold text-brand-100">
              <BotswanaFlag className="h-3.5 w-5 rounded-sm ring-1 ring-black/10" />
              <EditableText as="span" contentKey="site.footer.proudly">
                Proudly Botswana
              </EditableText>
            </div>
          </div>

          {officers.map((officer) => (
            <EditableOfficerCard
              key={officer.prefix}
              role={officer.role}
              prefix={officer.prefix}
              defaults={officer.defaults}
              variant="footer"
            />
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
            <EditableText
              as="span"
              contentKey="site.footer.license"
              className="mt-0.5 block text-[11px] text-brand-400 sm:text-xs"
            >
              {licenseLine}
            </EditableText>
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
