import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Info, Trash2, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type ConfirmTone = 'info' | 'warning' | 'danger'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  icon?: LucideIcon
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

const toneConfig: Record<
  ConfirmTone,
  { icon: LucideIcon; iconWrap: string; confirmVariant: 'primary' | 'gold'; confirmClass?: string }
> = {
  info: {
    icon: Info,
    iconWrap: 'bg-brand-50 text-brand-600',
    confirmVariant: 'primary',
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: 'bg-amber-50 text-amber-600',
    confirmVariant: 'gold',
  },
  danger: {
    icon: Trash2,
    iconWrap: 'bg-red-50 text-red-600',
    confirmVariant: 'primary',
    confirmClass: 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20',
  },
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const close = useCallback((value: boolean) => {
    resolverRef.current?.(value)
    resolverRef.current = null
    setOpen(false)
  }, [])

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current?.(false)
      resolverRef.current = resolve
      setOptions(opts)
      setOpen(true)
    })
  }, [])

  const tone = options?.tone ?? 'info'
  const config = toneConfig[tone]
  const Icon = options?.icon ?? config.icon

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {open && options && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Dismiss"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-950/50 backdrop-blur-sm"
              onClick={() => close(false)}
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-message"
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-2xl shadow-brand-950/20"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-brand-600 via-brand-500 to-gold-400" />
              <div className="p-6 sm:p-7">
                <div className="flex gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${config.iconWrap}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h2
                      id="confirm-title"
                      className="text-lg font-semibold tracking-tight text-brand-900"
                    >
                      {options.title}
                    </h2>
                    <p
                      id="confirm-message"
                      className="mt-2 text-sm leading-relaxed text-brand-600"
                    >
                      {options.message}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="sm:min-w-[100px]"
                    onClick={() => close(false)}
                  >
                    {options.cancelLabel ?? 'Cancel'}
                  </Button>
                  <Button
                    type="button"
                    variant={config.confirmVariant}
                    size="sm"
                    className={`sm:min-w-[100px] ${config.confirmClass ?? ''}`}
                    onClick={() => close(true)}
                    autoFocus
                  >
                    {options.confirmLabel ?? 'Continue'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
  return ctx
}
