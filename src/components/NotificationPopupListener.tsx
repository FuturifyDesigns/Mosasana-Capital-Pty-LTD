import { useEffect, useRef } from 'react'
import { useNotifications } from '@/context/NotificationContext'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { getNotificationPath } from '@/lib/notificationLinks'

/** Shows a toast popup when a new in-app notification arrives (realtime). */
export function NotificationPopupListener() {
  const { notifications, markAsRead } = useNotifications()
  const { showToast } = useToast()
  const { isAdmin } = useAuth()
  const seenRef = useRef<Set<string>>(new Set())
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (!notifications.length) return

    if (!bootstrapped.current) {
      notifications.forEach((n) => seenRef.current.add(n.id))
      bootstrapped.current = true
      return
    }

    for (const n of notifications) {
      if (seenRef.current.has(n.id)) continue
      seenRef.current.add(n.id)

      const toastType =
        n.type === 'loan_paid' || n.type === 'payment_received'
          ? 'success'
          : n.type === 'loan_status' && n.message.toLowerCase().includes('not approved')
            ? 'error'
            : 'info'

      const message =
        n.type === 'loan_paid'
          ? `${n.title} ${n.message}`
          : `${n.title} — ${n.message}`

      showToast(message, toastType, {
        href: getNotificationPath(n, isAdmin),
        onNavigate: () => {
          if (!n.read_at) markAsRead(n.id)
        },
      })
    }
  }, [notifications, showToast, isAdmin, markAsRead])

  return null
}
