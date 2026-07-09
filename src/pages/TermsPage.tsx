import { LegalPageLayout, LegalSection } from '@/components/LegalPageLayout'
import { useLanguage } from '@/context/LanguageContext'
import { useLocalizedTermsSections } from '@/lib/i18n/useLegalSections'

export function TermsPage() {
  const { t, language } = useLanguage()
  const termsSections = useLocalizedTermsSections()

  const sections = termsSections.map((section) => ({
    id: section.key,
    title: section.title,
  }))

  return (
    <LegalPageLayout
      title={t('terms.hero.title')}
      subtitle={t('terms.hero.subtitle')}
      titleKey={language === 'en' ? 'terms.hero.title' : undefined}
      subtitleKey={language === 'en' ? 'terms.hero.subtitle' : undefined}
      variant="terms"
      sections={sections}
    >
      {termsSections.map((section, index) => (
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
