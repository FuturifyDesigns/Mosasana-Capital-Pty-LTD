import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Lock, Upload, CheckCircle2, ImageIcon, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import { COMPANY } from '@/lib/constants'

type FieldType = 'text' | 'select' | 'upload'

interface Field {
  label: string
  value: string
  type: FieldType
  required?: boolean
}

const FIELDS: Field[] = [
  { label: 'Full Name', value: 'Thabo Nkile', type: 'text', required: true },
  { label: 'Email', value: 'thabo@example.com', type: 'text', required: true },
  { label: 'Phone', value: '71 234 567', type: 'text', required: true },
  { label: 'Document Type', value: 'Omang / National ID', type: 'select', required: true },
  { label: 'Omang / National ID Number', value: '123456789', type: 'text', required: true },
  { label: 'ID Document Photo', value: 'omang-id.jpg', type: 'upload', required: true },
  { label: 'Physical Address', value: 'Plot 456, Gaborone', type: 'text', required: true },
  { label: 'Loan Amount (Pula)', value: '3000', type: 'text', required: true },
  { label: 'Repayment Period', value: '3 months', type: 'select', required: true },
  { label: 'Purpose of Loan', value: 'Rent for this month', type: 'text', required: true },
  { label: 'Employment Status', value: 'Employed', type: 'select', required: true },
  { label: 'Monthly Income (Pula, optional)', value: '12000', type: 'text' },
  { label: 'Bank / Wallet', value: 'Orange Money', type: 'select', required: true },
  { label: 'Name on Account', value: 'Thabo Nkile', type: 'text', required: true },
  { label: 'Orange Money Number', value: '71234567', type: 'text', required: true },
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function WebsiteFormAnimation() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(-1)
  const [typed, setTyped] = useState('')
  const [filled, setFilled] = useState<Record<number, string>>(
    reduce ? Object.fromEntries(FIELDS.map((f, i) => [i, f.value])) : {},
  )
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(reduce)

  const scrollRef = useRef<HTMLDivElement>(null)
  const fieldRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (reduce) return
    let cancelled = false

    async function run() {
      while (!cancelled) {
        setDone(false)
        setFilled({})
        setTyped('')
        setActive(-1)
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        await wait(700)

        for (let i = 0; i < FIELDS.length; i++) {
          if (cancelled) return
          const field = FIELDS[i]
          setActive(i)
          setTyped('')

          if (field.type === 'text') {
            for (let c = 1; c <= field.value.length; c++) {
              if (cancelled) return
              setTyped(field.value.slice(0, c))
              await wait(45)
            }
          } else {
            await wait(650)
            if (cancelled) return
            setTyped(field.value)
          }

          setFilled((prev) => ({ ...prev, [i]: field.value }))
          await wait(400)
        }

        setActive(-1)
        await wait(500)
        setSubmitting(true)
        await wait(1300)
        if (cancelled) return
        setSubmitting(false)
        setDone(true)
        await wait(3600)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [reduce])

  useEffect(() => {
    const container = scrollRef.current
    if (!container || active < 0) return
    const el = fieldRefs.current[active]
    if (el) {
      container.scrollTo({ top: Math.max(0, el.offsetTop - 96), behavior: 'smooth' })
    }
  }, [active])

  useEffect(() => {
    const container = scrollRef.current
    if (container && submitting) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }
  }, [submitting])

  const valueFor = (i: number) => filled[i] ?? (i === active ? typed : '')

  return (
    <div className="relative w-full max-w-md">
      <div className="relative overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-2xl">
        <div className="border-b border-brand-100 bg-brand-50 px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-brand-400">
              <ChevronLeft className="h-4 w-4" />
              <ChevronRight className="h-4 w-4" />
              <RotateCw className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-1 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] text-brand-600 shadow-sm ring-1 ring-brand-100">
              <Lock className="h-3 w-3 shrink-0 text-growth-500" />
              <span className="truncate">mosasanacapital.com/apply</span>
            </div>
          </div>
        </div>

        <div className="relative h-[280px] overflow-hidden sm:h-[430px]">
          <div
            ref={scrollRef}
            className="h-full select-none overflow-hidden overscroll-contain px-4 py-4 sm:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <p className="font-display text-base font-bold text-brand-900">Secure Loan Application</p>
            <p className="mt-0.5 text-[11px] text-brand-500">
              All information is encrypted and securely stored.
            </p>

            <div className="mt-3 space-y-2.5">
              {FIELDS.map((field, i) => (
                <div
                  key={field.label}
                  ref={(el) => {
                    fieldRefs.current[i] = el
                  }}
                >
                  <label className="block text-[11px] font-medium text-brand-800">
                    {field.label}
                    {field.required && <span className="ml-0.5 text-red-500">*</span>}
                  </label>

                  {field.type === 'upload' ? (
                    <div
                      className={`mt-1 flex items-center gap-2 rounded-lg border-2 border-dashed px-3 py-2 transition ${
                        i === active ? 'border-brand-400 bg-brand-50' : 'border-brand-200'
                      }`}
                    >
                      {valueFor(i) ? (
                        <>
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-100 text-brand-600">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                          <span className="text-[12px] text-brand-700">{valueFor(i)}</span>
                          <CheckCircle2 className="ml-auto h-4 w-4 text-growth-500" />
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-brand-400" />
                          <span className="text-[11px] text-brand-400">JPEG, PNG or WebP — max 5MB</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`mt-1 flex h-9 items-center rounded-lg border bg-white px-3 text-[13px] transition ${
                        i === active ? 'border-brand-500 ring-2 ring-brand-200' : 'border-brand-200'
                      }`}
                    >
                      <span className="truncate text-brand-900">
                        {field.label.includes('Amount') && valueFor(i) ? `P ${valueFor(i)}` : valueFor(i)}
                      </span>
                      {i === active && field.type === 'text' && (
                        <motion.span
                          className="ml-0.5 inline-block h-4 w-px bg-brand-500"
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        />
                      )}
                      {field.type === 'select' && <span className="ml-auto text-brand-400">▾</span>}
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                className={`mt-2 flex h-10 w-full items-center justify-center rounded-lg font-semibold text-white transition ${
                  submitting ? 'bg-brand-500' : 'bg-brand-600'
                }`}
              >
                {submitting ? (
                  <motion.span
                    className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/95 px-6 text-center backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                >
                  <CheckCircle2 className="h-16 w-16 text-growth-500" />
                </motion.div>
                <p className="font-display text-xl font-bold text-brand-900">Application Submitted!</p>
                <p className="text-sm text-brand-600">
                  {COMPANY.shortName} will review your request and get back to you shortly.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
