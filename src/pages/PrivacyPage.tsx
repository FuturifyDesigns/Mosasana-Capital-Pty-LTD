import { LegalPageLayout, LegalSection } from '@/components/LegalPageLayout'
import { useLanguage } from '@/context/LanguageContext'
import { useLocalizedPrivacySections } from '@/lib/i18n/useLegalSections'

export function PrivacyPage() {
  const { t, language } = useLanguage()
  const privacySections = useLocalizedPrivacySections()

  const sections = privacySections.map((section) => ({
    id: section.key,
    title: section.title,
  }))

  return (
    <LegalPageLayout
      title={t('privacy.hero.title')}
      subtitle={t('privacy.hero.subtitle')}
      titleKey={language === 'en' ? 'privacy.hero.title' : undefined}
      subtitleKey={language === 'en' ? 'privacy.hero.subtitle' : undefined}
      variant="privacy"
      sections={sections}
    >
      {privacySections.map((section, index) => (
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
