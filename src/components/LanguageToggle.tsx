import { Languages } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { LANGUAGE_LABELS } from '@/lib/i18n/types'

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage()
  const other = language === 'en' ? 'tn' : 'en'

  return (
    <button
      type="button"
      onClick={() => setLanguage(other)}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white text-brand-700 transition hover:bg-brand-50 ${
        compact ? 'px-2.5 py-1.5 text-xs font-semibold' : 'px-3 py-2 text-sm font-medium'
      }`}
      title={`${LANGUAGE_LABELS[other]}`}
      aria-label={`Switch to ${LANGUAGE_LABELS[other]}`}
    >
      <Languages className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      <span>{language === 'en' ? 'Setswana' : 'English'}</span>
    </button>
  )
}
