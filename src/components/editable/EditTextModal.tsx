import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useContent } from '@/context/ContentContext'
import { useToast } from '@/context/ToastContext'

interface EditTextModalProps {
  contentKey: string
  initial: string
  multiline?: boolean
  onClose: () => void
}

export function EditTextModal({ contentKey, initial, multiline, onClose }: EditTextModalProps) {
  const { saveText } = useContent()
  const { showToast } = useToast()
  const [value, setValue] = useState(initial)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveText(contentKey, value)
      showToast('Content updated.', 'success')
      onClose()
    } catch {
      showToast('Could not save. Make sure you are signed in as an admin.', 'error')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg rounded-2xl border border-brand-100 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-brand-900">Edit content</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-300 transition hover:text-brand-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {multiline ? (
          <textarea
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={6}
            className="mt-4 w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-brand-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        ) : (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-4 w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-brand-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving}>
            Save changes
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
