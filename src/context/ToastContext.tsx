import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Info, XCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const accents = {
  success: 'text-growth-500',
  error: 'text-red-500',
  info: 'text-brand-500',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-[200] mx-auto flex max-w-sm flex-col gap-3 sm:inset-x-auto sm:right-6 sm:top-6">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = icons[toast.type]
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-2xl"
                role="status"
              >
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${accents[toast.type]}`} />
                <p className="flex-1 text-sm font-medium text-brand-800">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="text-brand-300 transition hover:text-brand-600"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
