import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageHero } from '@/components/ui/PageHero'

interface LegalPageLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function LegalPageLayout({ title, subtitle, children }: LegalPageLayoutProps) {
  return (
    <>
      <PageHero title={title} subtitle={subtitle} />
      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="prose-legal space-y-6 text-brand-700">{children}</div>
        <p className="mt-10 border-t border-brand-100 pt-6 text-center text-sm text-brand-500">
          Questions?{' '}
          <Link to="/contact" className="font-semibold text-brand-700 hover:text-brand-900">
            Contact us
          </Link>
        </p>
      </article>
    </>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-brand-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed sm:text-base">{children}</div>
    </section>
  )
}
