import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie } from 'lucide-react'
import { Button } from './ui/Button'
import { useToast } from '@/context/ToastContext'
import { getCookie, setCookie, COOKIE_CONSENT_KEY } from '@/lib/cookies'

export function CookieConsent() {
  const { showToast } = useToast()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!getCookie(COOKIE_CONSENT_KEY)) {
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  const handleChoice = (choice: 'accepted' | 'declined') => {
    setCookie(COOKIE_CONSENT_KEY, choice)
    setVisible(false)
    showToast(
      choice === 'accepted'
        ? 'You have accepted cookies. Thank you!'
        : 'You have declined cookies. Only essential cookies will be used.',
      choice === 'accepted' ? 'success' : 'info',
    )
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-[150] px-4 pb-4 sm:px-6 sm:pb-6"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 rounded-2xl border border-brand-100 bg-white/95 p-5 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <Cookie className="h-5 w-5" />
              </span>
              <p className="text-sm leading-relaxed text-brand-700">
                We use cookies to keep you signed in and improve your experience. You can accept all
                cookies or continue with only the essential ones.
              </p>
            </div>
            <div className="flex w-full shrink-0 gap-2 sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => handleChoice('declined')}
              >
                Decline
              </Button>
              <Button
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => handleChoice('accepted')}
              >
                Accept
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
