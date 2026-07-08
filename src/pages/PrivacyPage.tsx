import { LegalPageLayout, LegalSection } from '@/components/LegalPageLayout'
import { RegulatoryNotice } from '@/components/RegulatoryNotice'
import { COMPANY } from '@/lib/constants'
import { PRIVACY_SECTIONS } from '@/lib/privacySections'

const { dataProtection: DPA } = COMPANY

export function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle={`${COMPANY.legalName} · Effective ${COMPANY.privacyEffectiveDate} (aligned with ${DPA.actReference})`}
      titleKey="privacy.hero.title"
      subtitleKey="privacy.hero.subtitle"
    >
      <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
        <RegulatoryNotice className="!text-brand-700" />
      </div>

      {PRIVACY_SECTIONS.map((section) => (
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
