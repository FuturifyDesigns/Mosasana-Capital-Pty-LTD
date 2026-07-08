import { LegalPageLayout, LegalSection } from '@/components/LegalPageLayout'
import { RegulatoryNotice } from '@/components/RegulatoryNotice'
import { COMPANY } from '@/lib/constants'
import { TERMS_SECTIONS } from '@/lib/termsSections'

export function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms and Conditions"
      subtitle={`Effective ${COMPANY.termsEffectiveDate} · ${COMPANY.legalName}`}
      titleKey="terms.hero.title"
      subtitleKey="terms.hero.subtitle"
    >
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <RegulatoryNotice className="!text-amber-950" />
      </div>

      {TERMS_SECTIONS.map((section) => (
        <LegalSection
          key={section.key}
          sectionKey={section.key}
          title={section.title}
          body={section.body}
        />
      ))}
    </LegalPageLayout>
  )
}
