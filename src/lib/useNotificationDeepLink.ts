import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Scroll a deep-linked element into view once it exists in the DOM. */
export function useScrollToId(
  elementId: string | null | undefined,
  enabled = true,
  deps: unknown[] = [],
) {
  useEffect(() => {
    if (!enabled || !elementId) return

    const scroll = () => {
      const el = document.getElementById(elementId)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    scroll()
    const timer = window.setTimeout(scroll, 250)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies extra deps intentionally
  }, [elementId, enabled, ...deps])
}

export function useNotificationSearchParams() {
  const [searchParams] = useSearchParams()
  return {
    tab: searchParams.get('tab'),
    loanId: searchParams.get('loan'),
  }
}
