import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4 }}
      whileHover={hover ? { y: -4, boxShadow: '0 12px 40px rgba(47, 109, 154, 0.12)' } : undefined}
      className={`rounded-2xl border border-brand-100 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </motion.div>
  )
}
