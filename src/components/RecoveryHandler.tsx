import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { isEmailVerification } from '@/lib/verifiedFlag'

/**
 * Handles Supabase auth-link arrivals:
 *  - Email confirmation links (contain `type=signup` / `?verified=1`) → /verified
 *  - Password-recovery links → /reset-password
 */
export function RecoveryHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    if (isEmailVerification) {
      navigate('/verified', { replace: true })
      // Strip any leftover auth query params from the URL.
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
