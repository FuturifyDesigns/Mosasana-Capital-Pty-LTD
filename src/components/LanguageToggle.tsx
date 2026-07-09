import { motion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import type { Language } from '@/lib/i18n/types'

const LANGUAGES: { code: Language; compact: string; fullKey: 'nav.langEnglish' | 'nav.langSetswana' }[] = [
  { code: 'en', compact: 'EN', fullKey: 'nav.langEnglish' },
  { code: 'tn', compact: 'Setswana', fullKey: 'nav.langSetswana' },
]

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div
      role="group"
      aria-label={t('nav.languageGroup')}
      className={`relative inline-grid grid-cols-2 rounded-full bg-brand-100/90 p-0.5 ring-1 ring-brand-200/80 shadow-[inset_0_1px_2px_rgba(31,63,87,0.06)] ${
        compact ? 'min-w-[8.75rem]' : 'min-w-[11rem]'
      }`}
    >
      {LANGUAGES.map((option) => {
        const active = language === option.code
        const label = compact ? option.compact : t(option.fullKey)

        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLanguage(option.code)}
            aria-pressed={active}
            aria-label={t(option.code === 'en' ? 'nav.switchToEnglish' : 'nav.switchToSetswana')}
            className={`relative z-10 rounded-full px-2 py-1.5 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60 focus-visible:ring-offset-1 ${
              compact
                ? option.code === 'tn'
                  ? 'text-[10px] leading-tight'
                  : 'text-[11px] leading-none'
                : 'text-xs'
            } ${
              active
                ? 'font-bold text-brand-900'
                : 'font-semibold text-brand-500 hover:text-brand-700'
            }`}
          >
            <span className="relative">
              {label}
              {active && (
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-1/2 h-0.5 w-3.5 -translate-x-1/2 rounded-full bg-gold-500"
                />
              )}
            </span>
          </button>
        )
      })}

      <motion.span
        layout
        layoutId="mosasana-lang-pill"
        transition={{ type: 'spring', stiffness: 520, damping: 34 }}
        className="absolute inset-y-0.5 w-[calc(50%-2px)] rounded-full bg-white shadow-[0_1px_3px_rgba(31,63,87,0.12),0_0_0_1px_rgba(201,162,39,0.18)]"
        style={{ left: language === 'en' ? '2px' : 'calc(50% + 0px)' }}
      />
    </div>
  )
}
