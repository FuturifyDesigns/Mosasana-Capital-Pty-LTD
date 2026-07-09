import type { AppNotification } from '@/lib/supabase'

type NotificationRouteInput = Pick<AppNotification, 'type' | 'loan_id'>

/** Hash-router path for a notification (includes query params for deep links). */
export function getNotificationPath(
  notification: NotificationRouteInput,
  isAdmin: boolean,
): string {
  if (isAdmin) {
    if (notification.type === 'new_enquiry') {
      return '/admin?tab=enquiries'
    }

    if (notification.type === 'new_loan' || notification.loan_id) {
      return notification.loan_id
        ? `/admin?tab=loans&loan=${notification.loan_id}`
        : '/admin?tab=loans'
    }

    return '/admin'
  }

  if (notification.loan_id) {
    return `/dashboard?loan=${notification.loan_id}`
  }

  return '/dashboard'
}
