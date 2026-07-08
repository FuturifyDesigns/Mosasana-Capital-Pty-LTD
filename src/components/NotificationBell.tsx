import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, FileText, Wallet, MessageSquare, Info, Percent, PartyPopper } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '@/context/NotificationContext'
import { useAuth } from '@/context/AuthContext'
import type { AppNotification } from '@/lib/supabase'

const typeIcon: Record<string, typeof Bell> = {
  new_loan: FileText,
  loan_status: Info,
  loan_paid: PartyPopper,
  payment_received: Wallet,
  interest_added: Percent,
  terms_updated: Info,
  new_enquiry: MessageSquare,
}

function NotificationItem({
  item,
  onRead,
  link,
}: {
  item: AppNotification
  onRead: () => void
  link?: string
}) {
  const Icon = typeIcon[item.type] ?? Bell
  const content = (
    <div
      className={`flex gap-3 rounded-xl p-3 transition ${
        item.read_at ? 'bg-white' : 'bg-brand-50'
      } hover:bg-brand-50/80`}
      onClick={onRead}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onRead()}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-brand-900">{item.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-brand-600">{item.message}</p>
        <p className="mt-1 text-[10px] text-brand-400">
          {new Date(item.created_at).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
      {!item.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
    </div>
  )

  if (link) {
    return (
      <Link to={link} onClick={onRead} className="block">
        {content}
      </Link>
    )
  }
  return content
}

export function NotificationBell() {
  const { user, isAdmin } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!user) return null

  const portalLink = isAdmin ? '/admin' : '/dashboard'

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-brand-700 transition hover:bg-brand-50"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-xl shadow-brand-900/10"
          >
            <div className="flex items-center justify-between border-b border-brand-100 px-4 py-3">
              <p className="text-sm font-semibold text-brand-900">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-800"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {notifications.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-brand-500">No notifications yet.</p>
              ) : (
                notifications.map((item) => (
                  <NotificationItem
                    key={item.id}
                    item={item}
                    link={portalLink}
                    onRead={() => {
                      if (!item.read_at) markAsRead(item.id)
                      setOpen(false)
                    }}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
