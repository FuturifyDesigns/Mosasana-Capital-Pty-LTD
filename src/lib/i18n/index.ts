import type { Language } from './types'
import { formatTranslation } from './format'
import { en as dashboardEn, tn as dashboardTn } from './dashboard'
import { en as commonEn, tn as commonTn } from './common'
import { en as navEn, tn as navTn } from './nav'
import { en as authEn, tn as authTn } from './auth'
import { en as adminEn, tn as adminTn } from './admin'
import { en as applyEn, tn as applyTn } from './apply'
import { en as contactEn, tn as contactTn } from './contact'
import { en as homeEn, tn as homeTn } from './home'
import { en as aboutEn, tn as aboutTn } from './about'
import { en as legalEn, tn as legalTn } from './legal'
import { en as validationEn, tn as validationTn } from './validation'

export const translations = {
  en: {
    ...dashboardEn,
    ...commonEn,
    ...navEn,
    ...authEn,
    ...adminEn,
    ...applyEn,
    ...contactEn,
    ...homeEn,
    ...aboutEn,
    ...legalEn,
    ...validationEn,
  },
  tn: {
    ...dashboardTn,
    ...commonTn,
    ...navTn,
    ...authTn,
    ...adminTn,
    ...applyTn,
    ...contactTn,
    ...homeTn,
    ...aboutTn,
    ...legalTn,
    ...validationTn,
  },
} as const

export type TranslationKey = keyof typeof translations.en

export function translate(
  language: Language,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const template =
    translations[language][key] ?? translations.en[key] ?? (key as string)
  return formatTranslation(template, vars)
}

export { formatTranslation }
