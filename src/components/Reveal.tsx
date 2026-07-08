import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'
import { useIsMobile } from '@/lib/useMediaQuery'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: Direction
  once?: boolean
  blur?: boolean
}

function resolveDirection(direction: Direction, mobile: boolean): Direction {
  if (mobile && (direction === 'left' || direction === 'right')) return 'up'
  return direction
}

function getOffset(direction: Direction, mobile: boolean) {
  const amount = mobile ? 20 : 48
  const map: Record<Direction, { x?: number; y?: number }> = {
    up: { y: amount },
    down: { y: -amount },
    left: { x: amount },
    right: { x: -amount },
    none: {},
  }
  return map[direction]
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
  const mobile = useIsMobile()
  const resolvedDirection = resolveDirection(direction, mobile)
  const useBlur = blur && !mobile && !reduce
  const viewportMargin = mobile ? '-24px' : '-80px'

  const variants: Variants = {
    hidden: reduce
      ? { opacity: 0 }
      : { opacity: 0, ...getOffset(resolvedDirection, mobile), filter: useBlur ? 'blur(10px)' : 'blur(0px)' },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: mobile ? 0.55 : 0.8, ease: EASE, delay },
    },
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: viewportMargin }}
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
  const mobile = useIsMobile()

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: mobile ? '-24px' : '-80px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: mobile ? stagger * 0.6 : stagger } },
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
  const mobile = useIsMobile()
  const resolvedDirection = resolveDirection(direction, mobile)
  const useBlur = blur && !mobile && !reduce

  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce
          ? { opacity: 0 }
          : { opacity: 0, ...getOffset(resolvedDirection, mobile), filter: useBlur ? 'blur(10px)' : 'blur(0px)' },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration: mobile ? 0.5 : 0.7, ease: EASE_ITEM },
        },
      }}
    >
      {children}
    </motion.div>
  )
}
