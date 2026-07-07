import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, FileText, Wallet, type LucideIcon } from 'lucide-react'

interface Step {
  icon: LucideIcon
  title: string
  description: string
}

const steps: Step[] = [
  {
    icon: UserPlus,
    title: 'Create your account',
    description: 'Sign up in minutes and verify your email to get started securely.',
  },
  {
    icon: FileText,
    title: 'Submit your request',
    description: 'Fill in the loan form, upload your ID, and tell us how much you need.',
  },
  {
    icon: Wallet,
    title: 'Get your funds',
    description: 'Our team reviews your request and disburses your approved loan quickly.',
  },
]

const STEP_MS = 2800

export function HowItWorksCycle() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % steps.length), STEP_MS)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative grid gap-10 md:grid-cols-3">
      {/* connector track */}
      <div className="absolute left-0 right-0 top-12 hidden h-1 rounded-full bg-brand-100 md:block">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
          animate={{ width: `${(active / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {steps.map((step, i) => {
        const isActive = i === active
        const R = 44
        const C = 2 * Math.PI * R
        return (
          <div key={step.title} className="relative text-center">
            <div className="relative z-10 mx-auto mb-5 h-24 w-24">
              {/* progress ring — track always visible, fills while step is active */}
              <svg className="absolute inset-0 h-24 w-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r={R} fill="none" stroke="#dceef8" strokeWidth="4" />
                {isActive && (
                  <motion.circle
                    key={active}
                    cx="48"
                    cy="48"
                    r={R}
                    fill="none"
                    stroke="#3d87b8"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    initial={{ strokeDashoffset: C }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: STEP_MS / 1000, ease: 'linear' }}
                  />
                )}
              </svg>
              <motion.div
                animate={{
                  scale: isActive ? 1.08 : 1,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className={`absolute inset-[14px] flex items-center justify-center rounded-2xl transition-colors duration-500 ${
                  isActive
                    ? 'bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/30'
                    : 'bg-brand-100 text-brand-500'
                }`}
              >
                <step.icon className="h-8 w-8" />
              </motion.div>
              <span
                className={`absolute -right-0.5 -top-0.5 z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm transition-colors duration-500 ${
                  isActive ? 'bg-gold-500' : 'bg-brand-300'
                }`}
              >
                {i + 1}
              </span>
            </div>
            <h3
              className={`text-lg font-semibold transition-colors duration-500 ${
                isActive ? 'text-brand-900' : 'text-brand-500'
              }`}
            >
              {step.title}
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-brand-600">{step.description}</p>
          </div>
        )
      })}
    </div>
  )
}
