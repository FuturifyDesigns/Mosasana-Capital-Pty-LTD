import { motion } from 'framer-motion'
import { useMemo } from 'react'

const W = 1200
const H = 320
const SAMPLES = 8
const STEPS = 8

function strandPath(midY: number, amp: number, wavelength: number, phase: number): string {
  const dx = W / SAMPLES
  const y = (i: number) => midY + amp * Math.sin(((i * dx) / wavelength) * Math.PI * 2 + phase)
  let d = `M 0 ${y(0).toFixed(1)}`
  for (let i = 0; i < SAMPLES; i++) {
    const x1 = (i + 1) * dx
    const c1x = i * dx + dx / 3
    const c2x = x1 - dx / 3
    d += ` C ${c1x.toFixed(1)} ${y(i).toFixed(1)} ${c2x.toFixed(1)} ${y(i + 1).toFixed(1)} ${x1.toFixed(1)} ${y(i + 1).toFixed(1)}`
  }
  return d
}

function keyframes(midY: number, amp: number, wavelength: number, base: number): string[] {
  return Array.from({ length: STEPS + 1 }, (_, k) =>
    strandPath(midY, amp, wavelength, base + (k / STEPS) * Math.PI * 2),
  )
}

interface Strand {
  midY: number
  amp: number
  wl: number
  dur: number
  phase: number
  width: number
  color: string
  opacity: number
}

interface FlagStrandsProps {
  variant?: 'light' | 'dark'
  className?: string
}

export function FlagStrands({ variant = 'light', className = '' }: FlagStrandsProps) {
  const strands = useMemo<Strand[]>(() => {
    const palette =
      variant === 'dark'
        ? ['#ffffff', '#b8ddf0', '#8bc4e3', '#dceef8', '#5aa5d1', '#ffffff']
        : ['#5aa5d1', '#8bc4e3', '#2f6d9a', '#b8ddf0', '#3d87b8', '#ffffff']
    const baseOpacity = variant === 'dark' ? 0.35 : 0.22
    return [
      { midY: 60, amp: 26, wl: 560, dur: 15, phase: 0.0, width: 2 },
      { midY: 110, amp: 34, wl: 640, dur: 19, phase: 1.1, width: 1.5 },
      { midY: 160, amp: 30, wl: 500, dur: 17, phase: 2.2, width: 2.5 },
      { midY: 210, amp: 38, wl: 700, dur: 22, phase: 0.6, width: 1.5 },
      { midY: 250, amp: 28, wl: 540, dur: 16, phase: 3.0, width: 2 },
      { midY: 290, amp: 32, wl: 620, dur: 20, phase: 1.8, width: 1.5 },
    ].map((s, i) => ({
      ...s,
      color: palette[i % palette.length],
      opacity: baseOpacity - i * 0.02,
    }))
  }, [variant])

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {strands.map((s, i) => (
          <motion.path
            key={i}
            stroke={s.color}
            strokeWidth={s.width}
            strokeLinecap="round"
            style={{ opacity: s.opacity }}
            initial={{ d: strandPath(s.midY, s.amp, s.wl, s.phase) }}
            animate={{ d: keyframes(s.midY, s.amp, s.wl, s.phase) }}
            transition={{ duration: s.dur, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </svg>
    </div>
  )
}
