import { useRef, useState } from 'react'
import { Pencil, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useContent } from '@/context/ContentContext'
import { useToast } from '@/context/ToastContext'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

interface EditableImageProps {
  /** Unique content key, e.g. "home.hero.image" */
  contentKey: string
  /** Default image src used until an admin replaces it */
  src: string
  alt: string
  /** Classes applied to the <img> element */
  className?: string
  /** Classes applied to the wrapper (admin mode) */
  wrapperClassName?: string
  /** Load immediately (for above-the-fold images like the hero). Defaults to lazy. */
  eager?: boolean
}

export function EditableImage({
  contentKey,
  src,
  alt,
  className,
  wrapperClassName,
  eager = false,
}: EditableImageProps) {
  const { isAdmin } = useAuth()
  const { getImage, saveImage } = useContent()
  const { showToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const url = getImage(contentKey, src)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB.', 'error')
      return
    }
    setBusy(true)
    try {
      await saveImage(contentKey, file)
      showToast('Image updated.', 'success')
    } catch {
      showToast('Could not upload image. Make sure you are signed in as an admin.', 'error')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const img = (
    <OptimizedImage
      src={url}
      alt={alt}
      className={`block max-w-full ${className ?? ''}`}
      eager={eager}
    />
  )

  if (!isAdmin) {
    return img
  }

  const fillsParent =
    className?.includes('inset-0') ||
    className?.includes('h-full') ||
    wrapperClassName?.includes('inset-0') ||
    wrapperClassName?.includes('h-full')

  return (
    <span
      className={`group/edit ${fillsParent ? 'absolute inset-0' : 'relative block'} ${wrapperClassName ?? ''}`}
    >
      {img}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-brand-700/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm transition hover:bg-brand-800"
        aria-label="Replace this image"
        title="Replace this image"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
        {busy ? 'Uploading…' : 'Replace'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </span>
  )
}
