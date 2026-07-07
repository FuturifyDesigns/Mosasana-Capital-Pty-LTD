import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/Logo'

export function VerifiedPage() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-3xl border border-brand-100 bg-white p-10 shadow-2xl"
      >
        <div className="flex justify-center">
          <Logo className="h-14" />
        </div>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
          className="mt-8 flex justify-center"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-growth-500/10 text-growth-500">
            <CheckCircle2 className="h-11 w-11" />
          </span>
        </motion.div>
        <h1 className="mt-6 font-display text-2xl font-bold text-brand-900">Email verified</h1>
        <p className="mt-3 leading-relaxed text-brand-600">
          Your email address has been confirmed. You can now close this page.
        </p>
      </motion.div>
    </section>
  )
}
