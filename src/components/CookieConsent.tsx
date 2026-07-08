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

  useEffect(() => {
    const root = document.documentElement
    if (visible) {
      root.dataset.cookieVisible = 'true'
    } else {
      delete root.dataset.cookieVisible
    }
    return () => {
      delete root.dataset.cookieVisible
    }
  }, [visible])

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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-[150] box-border w-full max-w-[100vw] overflow-hidden px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="mx-auto box-border flex w-full min-w-0 max-w-4xl flex-col items-start gap-3 rounded-2xl border border-brand-100 bg-white/95 p-4 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center sm:gap-4 sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600 sm:h-10 sm:w-10">
                <Cookie className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <p className="min-w-0 break-words text-sm leading-relaxed text-brand-700">
                We use cookies to keep you signed in and improve your experience. You can accept all
                cookies or continue with only the essential ones.
              </p>
            </div>
            <div className="flex w-full min-w-0 shrink-0 gap-2 sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="min-w-0 flex-1 sm:flex-none"
                onClick={() => handleChoice('declined')}
              >
                Decline
              </Button>
              <Button
                size="sm"
                className="min-w-0 flex-1 sm:flex-none"
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
