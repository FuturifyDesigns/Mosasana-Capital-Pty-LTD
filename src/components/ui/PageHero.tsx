import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface PageHeroProps {
  title: string
  subtitle?: string
  children?: ReactNode
}

export function PageHero({ title, subtitle, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 py-20 text-white">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-white blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-gold-400 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-4 max-w-2xl text-lg text-brand-100">{subtitle}</p>}
          {children}
        </motion.div>
      </div>
    </section>
  )
}
