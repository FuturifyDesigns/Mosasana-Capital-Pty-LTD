import { useState, type ElementType } from 'react'
import { Pencil } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useContent } from '@/context/ContentContext'
import { EditTextModal } from './EditTextModal'

interface EditableTextProps {
  /** Unique content key, e.g. "home.hero.title" */
  contentKey: string
  /** Element to render as (default span) */
  as?: ElementType
  className?: string
  /** Default text shown until an admin overrides it */
  children: string
  /** Use a multi-line textarea in the editor */
  multiline?: boolean
}

export function EditableText({
  contentKey,
  as,
  className,
  children,
  multiline,
}: EditableTextProps) {
  const Tag = (as || 'span') as ElementType
  const { isAdmin } = useAuth()
  const { getText } = useContent()
  const [editing, setEditing] = useState(false)

  const value = getText(contentKey, children)

  if (!isAdmin) {
    return <Tag className={className}>{value}</Tag>
  }

  return (
    <Tag className={className}>
      {value}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="ml-1.5 inline-flex h-5 w-5 translate-y-[-1px] items-center justify-center rounded-md bg-brand-600/90 align-middle text-white opacity-70 shadow-sm transition hover:opacity-100"
        aria-label="Edit this text"
        title="Edit this text"
      >
        <Pencil className="h-3 w-3" />
      </button>
      {editing && (
        <EditTextModal
          contentKey={contentKey}
          initial={value}
          multiline={multiline}
          onClose={() => setEditing(false)}
        />
      )}
    </Tag>
  )
}
