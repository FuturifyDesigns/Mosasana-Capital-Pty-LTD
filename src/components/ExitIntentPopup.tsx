import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, HandHeart } from 'lucide-react'
import { Button } from './ui/Button'
import { WhatsAppIcon } from './icons/WhatsAppIcon'
import { TranslatedText } from '@/components/TranslatedText'
import { useLanguage } from '@/context/LanguageContext'
import { buildWhatsAppContactUrl } from '@/lib/whatsapp'
import { COMPANY } from '@/lib/constants'

const SESSION_KEY = 'mosasana_exit_shown'

export function ExitIntentPopup() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return

    const handleMouseOut = (e: MouseEvent) => {
      // Trigger when the cursor leaves through the top of the viewport.
      if (e.clientY <= 0 && !e.relatedTarget) {
        trigger()
      }
    }

    const trigger = () => {
      if (sessionStorage.getItem(SESSION_KEY)) return
      sessionStorage.setItem(SESSION_KEY, '1')
      setOpen(true)
      document.removeEventListener('mouseout', handleMouseOut)
    }

    document.addEventListener('mouseout', handleMouseOut)
    return () => document.removeEventListener('mouseout', handleMouseOut)
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[190] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-brand-100 bg-white p-8 text-center shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Leaving soon"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-brand-300 transition hover:text-brand-600"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/30">
              <HandHeart className="h-8 w-8" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold text-brand-900">
              <TranslatedText tnKey="popup.exit.title" contentKey="popup.exit.title" as="span">
                Leaving so soon?
              </TranslatedText>
            </h2>
            <p className="mt-3 leading-relaxed text-brand-600">
              <TranslatedText tnKey="popup.exit.body" contentKey="popup.exit.body" as="span" multiline>
                {`Need short-term relief for a financial shortfall? ${COMPANY.shortName} makes it quick and easy — apply online or chat with us on WhatsApp before you go.`}
              </TranslatedText>
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/account" className="flex-1" onClick={() => setOpen(false)}>
                <Button className="w-full">{t('common.getStarted')}</Button>
              </Link>
              <a
                href={buildWhatsAppContactUrl('Client', 'I would like to enquire about a loan.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                <Button variant="whatsapp" className="w-full">
                  <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                </Button>
              </a>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 text-sm font-medium text-brand-400 transition hover:text-brand-700"
            >
              {t('common.noThanks')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
