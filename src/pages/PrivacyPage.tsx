import { LegalPageLayout, LegalSection } from '@/components/LegalPageLayout'
import { COMPANY } from '@/lib/constants'
import { PRIVACY_SECTIONS } from '@/lib/privacySections'

const { dataProtection: DPA } = COMPANY

export function PrivacyPage() {
  const sections = PRIVACY_SECTIONS.map((section) => ({
    id: section.key,
    title: section.title,
  }))

  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle={`${COMPANY.legalName} · Effective ${COMPANY.privacyEffectiveDate} (aligned with ${DPA.actReference})`}
      titleKey="privacy.hero.title"
      subtitleKey="privacy.hero.subtitle"
      variant="privacy"
      sections={sections}
    >
      {PRIVACY_SECTIONS.map((section, index) => (
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
