import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from './Logo'

// A short, smooth splash shown once per browser session on first load.
export function IntroOverlay() {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false
    return !sessionStorage.getItem('introSeen')
  })

  useEffect(() => {
    if (!show) return
    sessionStorage.setItem('introSeen', '1')
    const t = setTimeout(() => setShow(false), 1500)
    return () => clearTimeout(t)
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <Logo className="h-16 sm:h-20" />
            <motion.div
              className="mt-6 h-0.5 w-32 overflow-hidden rounded-full bg-brand-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
