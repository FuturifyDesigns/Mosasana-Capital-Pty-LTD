import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FileText, ShieldCheck, ChevronRight } from 'lucide-react'
import { PageHero } from '@/components/ui/PageHero'
import { EditableLegalSection } from '@/components/editable/EditableLegalSection'
import { RegulatoryNotice } from '@/components/RegulatoryNotice'

export interface LegalSectionItem {
  id: string
  title: string
}

interface LegalPageLayoutProps {
  title: string
  subtitle: string
  titleKey?: string
  subtitleKey?: string
  variant?: 'privacy' | 'terms'
  sections?: LegalSectionItem[]
  children: ReactNode
}

const variantMeta = {
  privacy: {
    icon: ShieldCheck,
    badge: 'Privacy & data protection',
    intro:
      'We explain how Mosasana Capital collects, uses, and protects your personal information in line with Botswana law.',
  },
  terms: {
    icon: FileText,
    badge: 'Terms of service',
    intro:
      'Please read these terms carefully before applying for a loan or using our website and client services.',
  },
} as const

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function LegalPageLayout({
  title,
  subtitle,
  titleKey,
  subtitleKey,
  variant = 'privacy',
  sections = [],
  children,
}: LegalPageLayoutProps) {
  const meta = variantMeta[variant]
  const Icon = meta.icon
  const accent =
    variant === 'privacy'
      ? 'border-brand-200 bg-gradient-to-br from-brand-50 via-white to-brand-100/60'
      : 'border-gold-200 bg-gradient-to-br from-amber-50 via-white to-gold-400/10'

  return (
    <>
      <PageHero title={title} subtitle={subtitle} titleKey={titleKey} subtitleKey={subtitleKey}>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
          <Icon className="h-4 w-4 text-gold-300" />
          {meta.badge}
        </div>
      </PageHero>

      <div className="bg-gradient-to-b from-brand-50/80 to-white pb-16 pt-8 sm:pb-20 sm:pt-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div
            className={`mb-8 rounded-2xl border p-5 shadow-sm sm:mb-10 sm:p-6 ${accent}`}
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white shadow-md">
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-sm leading-relaxed text-brand-700 sm:text-base">{meta.intro}</p>
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
            {sections.length > 0 && (
              <aside className="mb-8 lg:mb-0">
                <nav
                  aria-label="On this page"
                  className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:rounded-2xl lg:border lg:border-brand-100 lg:bg-white lg:p-4 lg:shadow-sm"
                >
                  <p className="mb-3 hidden text-[11px] font-semibold uppercase tracking-widest text-brand-500 lg:block">
                    On this page
                  </p>
                  <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
                    {sections.map((section) => (
                      <li key={section.id} className="shrink-0 lg:shrink">
                        <button
                          type="button"
                          onClick={() => scrollToSection(section.id)}
                          className="flex w-full items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 py-2 text-left text-xs font-medium text-brand-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-900 lg:border-transparent lg:bg-transparent lg:px-2.5 lg:py-2 lg:text-sm lg:shadow-none"
                        >
                          <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-brand-400 lg:block" />
                          <span className="line-clamp-2 lg:line-clamp-3">{section.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
            )}

            <article className="min-w-0 space-y-4 sm:space-y-5">{children}</article>
          </div>

          <div className="mt-10 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-500">
              Regulatory notice
            </p>
            <RegulatoryNotice className="mt-3 !text-brand-600" />
          </div>

          <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-800 px-6 py-8 text-center text-white shadow-lg sm:px-10">
            <h2 className="font-display text-xl font-bold sm:text-2xl">Questions about this page?</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-brand-100 sm:text-base">
              Our team is happy to explain anything in plain language — no legal jargon required.
            </p>
            <Link
              to="/contact"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export function LegalSection({
  title,
  children,
  sectionKey,
  body,
  index,
}: {
  title: string
  children?: ReactNode
  sectionKey?: string
  body?: string
  index?: number
}) {
  if (sectionKey && body != null) {
    return (
      <EditableLegalSection
        sectionKey={sectionKey}
        title={title}
        body={body}
        index={index}
        variant={sectionKey.startsWith('terms.') ? 'terms' : 'privacy'}
      />
    )
  }

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-xl font-bold text-brand-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-brand-700 sm:text-base">
        {children}
      </div>
    </section>
  )
}
