import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  RealtimePostgresUpdatePayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresDeletePayload,
} from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/** Attach the signed-in JWT so postgres_changes respect RLS (required for admin live data). */
export async function syncRealtimeAuth(accessToken: string | null | undefined): Promise<void> {
  await supabase.realtime.setAuth(accessToken ?? null)
}

export type PostgresChangePayload<T extends Record<string, unknown>> =
  RealtimePostgresChangesPayload<T>

export function subscribeAdminTables(
  channelName: string,
  handlers: {
    onLoanChange: (payload: PostgresChangePayload<Record<string, unknown>>) => void
    onEnquiryChange: (payload: PostgresChangePayload<Record<string, unknown>>) => void
    onPaymentChange: (payload: PostgresChangePayload<Record<string, unknown>>) => void
    onSync: () => void
  },
): RealtimeChannel {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'loan_requests' },
      (payload) => {
        handlers.onLoanChange(payload)
        handlers.onSync()
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'contact_enquiries' },
      (payload) => {
        handlers.onEnquiryChange(payload)
        handlers.onSync()
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'loan_payments' },
      (payload) => {
        handlers.onPaymentChange(payload)
        handlers.onSync()
      },
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
      handlers.onSync()
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_reminder_log' }, () => {
      handlers.onSync()
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
      handlers.onSync()
    })
    .subscribe()

  return channel
}

export function mergeLoanFromPayload(
  loans: unknown[],
  payload: PostgresChangePayload<Record<string, unknown>>,
): unknown[] {
  const list = loans as { id: string }[]

  if (payload.eventType === 'INSERT') {
    const row = (payload as RealtimePostgresInsertPayload<Record<string, unknown>>).new as {
      id: string
    }
    if (!row?.id) return list
    if (list.some((l) => l.id === row.id)) return list
    return [row, ...list]
  }

  if (payload.eventType === 'UPDATE') {
    const row = (payload as RealtimePostgresUpdatePayload<Record<string, unknown>>).new as {
      id: string
    }
    if (!row?.id) return list
    return list.map((l) => (l.id === row.id ? row : l))
  }

  if (payload.eventType === 'DELETE') {
    const row = (payload as RealtimePostgresDeletePayload<Record<string, unknown>>).old as {
      id?: string
    }
    if (!row?.id) return list
    return list.filter((l) => l.id !== row.id)
  }

  return list
}

export function mergeEnquiryFromPayload(
  enquiries: unknown[],
  payload: PostgresChangePayload<Record<string, unknown>>,
): unknown[] {
  const list = enquiries as { id: string }[]

  if (payload.eventType === 'INSERT') {
    const row = (payload as RealtimePostgresInsertPayload<Record<string, unknown>>).new as {
      id: string
    }
    if (!row?.id) return list
    if (list.some((e) => e.id === row.id)) return list
    return [row, ...list]
  }

  if (payload.eventType === 'UPDATE') {
    const row = (payload as RealtimePostgresUpdatePayload<Record<string, unknown>>).new as {
      id: string
    }
    if (!row?.id) return list
    return list.map((e) => (e.id === row.id ? row : e))
  }

  if (payload.eventType === 'DELETE') {
    const row = (payload as RealtimePostgresDeletePayload<Record<string, unknown>>).old as {
      id?: string
    }
    if (!row?.id) return list
    return list.filter((e) => e.id !== row.id)
  }

  return list
}

export function mergePaymentFromPayload(
  payments: unknown[],
  payload: PostgresChangePayload<Record<string, unknown>>,
): unknown[] {
  const list = payments as { id: string }[]

  if (payload.eventType === 'INSERT') {
    const row = (payload as RealtimePostgresInsertPayload<Record<string, unknown>>).new as {
      id: string
    }
    if (!row?.id) return list
    if (list.some((p) => p.id === row.id)) return list
    return [row, ...list]
  }

  if (payload.eventType === 'UPDATE') {
    const row = (payload as RealtimePostgresUpdatePayload<Record<string, unknown>>).new as {
      id: string
    }
    if (!row?.id) return list
    return list.map((p) => (p.id === row.id ? row : p))
  }

  if (payload.eventType === 'DELETE') {
    const row = (payload as RealtimePostgresDeletePayload<Record<string, unknown>>).old as {
      id?: string
    }
    if (!row?.id) return list
    return list.filter((p) => p.id !== row.id)
  }

  return list
}
