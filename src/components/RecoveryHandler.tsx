import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

/**
 * Listens for Supabase password-recovery events (triggered when a user opens the
 * reset-password email link) and routes them to the reset-password page.
 */
export function RecoveryHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    // Email confirmation returns to the site root with ?verified=1 — route to the
    // "email verified" page and clean the query string.
    const params = new URLSearchParams(window.location.search)
    if (params.get('verified') === '1') {
      navigate('/verified', { replace: true })
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password')
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  return null
}
