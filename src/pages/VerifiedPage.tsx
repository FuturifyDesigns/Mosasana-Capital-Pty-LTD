import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { cleanVerificationFromUrl, clearEmailVerificationFlag } from '@/lib/verifiedFlag'

const confetti = [
  { left: '12%', top: '22%', color: 'bg-brand-400', delay: 0.3, size: 'h-2 w-2' },
  { left: '82%', top: '18%', color: 'bg-gold-400', delay: 0.45, size: 'h-2.5 w-2.5' },
  { left: '24%', top: '72%', color: 'bg-growth-500', delay: 0.6, size: 'h-2 w-2' },
  { left: '70%', top: '68%', color: 'bg-brand-300', delay: 0.5, size: 'h-3 w-3' },
  { left: '50%', top: '10%', color: 'bg-growth-500', delay: 0.7, size: 'h-1.5 w-1.5' },
  { left: '90%', top: '48%', color: 'bg-brand-400', delay: 0.4, size: 'h-2 w-2' },
  { left: '6%', top: '52%', color: 'bg-gold-400', delay: 0.55, size: 'h-1.5 w-1.5' },
]

export function VerifiedPage() {
  const navigate = useNavigate()

  const goToSignIn = () => {
    clearEmailVerificationFlag()
    cleanVerificationFromUrl()
    navigate('/login', { replace: true })
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100 px-4 py-16 text-center">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-growth-500/20 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {confetti.map((c, i) => (
        <motion.span
          key={i}
          aria-hidden
          className={`pointer-events-none absolute rounded-full ${c.color} ${c.size}`}
          style={{ left: c.left, top: c.top }}
          initial={{ opacity: 0, y: -10, scale: 0 }}
          animate={{ opacity: [0, 1, 0.8], y: [-10, 6, 0], scale: [0, 1.2, 1] }}
          transition={{ delay: c.delay, duration: 1.2, ease: 'easeOut' }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        className="relative z-10 w-full max-w-md rounded-[28px] border border-white/60 bg-white/80 p-10 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex justify-center">
          <Logo className="h-24 sm:h-28" />
        </div>

        <div className="relative mt-10 flex justify-center">
          <motion.span
            className="absolute h-24 w-24 rounded-full bg-growth-500/15"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.span
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 12 }}
            className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-growth-500 to-growth-600 shadow-lg shadow-growth-500/30"
          >
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.45, type: 'spring', stiffness: 300, damping: 14 }}
            >
              <Check className="h-12 w-12 text-white" strokeWidth={3} />
            </motion.span>
          </motion.span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 font-display text-3xl font-bold text-brand-900"
        >
          Email verified!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-3 leading-relaxed text-brand-600"
        >
          Your email address has been confirmed. Your account is now active — sign in to apply for a
          loan or track your applications.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-growth-500/10 px-4 py-2 text-sm font-medium text-growth-600"
        >
          <span className="flex h-2 w-2 rounded-full bg-growth-500" />
          Account activated
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95 }}
          className="mt-8 flex justify-center"
        >
          <Button type="button" size="lg" onClick={goToSignIn}>
            Continue to Sign In
            <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </motion.div>
    </main>
  )
}
