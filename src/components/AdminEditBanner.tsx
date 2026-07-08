import { Link } from 'react-router-dom'
import { Pencil, Shield } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

/** Shown to admins on public pages — inline edit mode is active (pencil icons). */
export function AdminEditBanner() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return null

  return (
    <div className="border-b border-brand-200 bg-gradient-to-r from-brand-700 to-brand-600 px-4 py-2 text-center text-sm text-white sm:px-6">
      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <Pencil className="h-4 w-4 shrink-0" />
        <span>
          <strong>Edit mode:</strong> click any pencil on this page to update text or images live.
        </span>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 font-semibold transition hover:bg-white/25"
        >
          <Shield className="h-3.5 w-3.5" />
          Admin portal
        </Link>
      </p>
    </div>
  )
}
