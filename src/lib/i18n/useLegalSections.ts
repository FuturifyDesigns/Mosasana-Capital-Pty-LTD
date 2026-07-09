import { useLanguage } from '@/context/LanguageContext'
import type { TranslationKey } from '@/lib/i18n'
import { TERMS_SECTIONS } from '@/lib/termsSections'
import { PRIVACY_SECTIONS } from '@/lib/privacySections'

export function useLocalizedTermsSections() {
  const { language, t } = useLanguage()
  if (language === 'en') return TERMS_SECTIONS

  return TERMS_SECTIONS.map((section) => {
    const id = section.key.replace('terms.', '')
    return {
      key: section.key,
      title: t(`legal.terms.${id}.title` as TranslationKey),
      body: t(`legal.terms.${id}.body` as TranslationKey),
    }
  })
}

export function useLocalizedPrivacySections() {
  const { language, t } = useLanguage()
  if (language === 'en') return PRIVACY_SECTIONS

  return PRIVACY_SECTIONS.map((section) => {
    const id = section.key.replace('privacy.', '')
    return {
      key: section.key,
      title: t(`legal.privacy.${id}.title` as TranslationKey),
      body: t(`legal.privacy.${id}.body` as TranslationKey),
    }
  })
}
