import { LegalPageLayout, LegalSection } from '@/components/LegalPageLayout'
import { COMPANY } from '@/lib/constants'
import { TERMS_SECTIONS } from '@/lib/termsSections'

export function TermsPage() {
  const sections = TERMS_SECTIONS.map((section) => ({
    id: section.key,
    title: section.title,
  }))

  return (
    <LegalPageLayout
      title="Terms and Conditions"
      subtitle={`Effective ${COMPANY.termsEffectiveDate} · ${COMPANY.legalName}`}
      titleKey="terms.hero.title"
      subtitleKey="terms.hero.subtitle"
      variant="terms"
      sections={sections}
    >
      {TERMS_SECTIONS.map((section, index) => (
        <LegalSection
          key={section.key}
          sectionKey={section.key}
          title={section.title}
          body={section.body}
          index={index + 1}
        />
      ))}
    </LegalPageLayout>
  )
}
