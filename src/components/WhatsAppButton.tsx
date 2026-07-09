import { motion } from 'framer-motion'
import { WhatsAppIcon } from './icons/WhatsAppIcon'
import { useLanguage } from '@/context/LanguageContext'
import { buildWhatsAppGeneralUrl } from '@/lib/whatsapp'

export function WhatsAppButton() {
  const { t } = useLanguage()

  return (
    <motion.a
      href={buildWhatsAppGeneralUrl()}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-[calc(var(--bottom-overlay)+env(safe-area-inset-bottom))] right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-green-600/30 transition hover:bg-[#1da851] sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
      aria-label={t('common.whatsappChat')}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </motion.a>
  )
}
