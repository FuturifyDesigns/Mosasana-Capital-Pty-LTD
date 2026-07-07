import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: Direction
  once?: boolean
  blur?: boolean
}

const offset: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 48 },
  down: { y: -48 },
  left: { x: 48 },
  right: { x: -48 },
  none: {},
}

// Smooth, refined easing inspired by Lusion-style scroll reveals.
const EASE = [0.22, 1, 0.36, 1] as const

export function Reveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  once = true,
  blur = true,
}: RevealProps) {
  const reduce = useReducedMotion()

  const variants: Variants = {
    hidden: reduce
      ? { opacity: 0 }
      : { opacity: 0, ...offset[direction], filter: blur ? 'blur(10px)' : 'blur(0px)' },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: EASE, delay },
    },
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-80px' }}
    >
      {children}
    </motion.div>
  )
}

interface RevealGroupProps {
  children: ReactNode
  className?: string
  stagger?: number
  once?: boolean
}

export function RevealGroup({ children, className = '', stagger = 0.12, once = true }: RevealGroupProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-80px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  )
}

const EASE_ITEM = [0.22, 1, 0.36, 1] as const

export function RevealItem({
  children,
  className = '',
  direction = 'up',
  blur = true,
}: {
  children: ReactNode
  className?: string
  direction?: Direction
  blur?: boolean
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce
          ? { opacity: 0 }
          : { opacity: 0, ...offset[direction], filter: blur ? 'blur(10px)' : 'blur(0px)' },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration: 0.7, ease: EASE_ITEM },
        },
      }}
    >
      {children}
    </motion.div>
  )
}
