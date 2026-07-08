import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { isEmailVerification } from '@/lib/verifiedFlag'

function isOAuthCallback(): boolean {
  try {
    const hash = window.location.hash || ''
    const search = window.location.search || ''
    return (
      (/access_token=/.test(hash) || /access_token=/.test(search)) &&
      !/type=signup/.test(hash) &&
      !/type=signup/.test(search)
    )
  } catch {
    return false
  }
}

/**
 * Handles Supabase auth-link arrivals:
 *  - Email confirmation links (contain `type=signup` / `?verified=1`) → /verified
 *  - Password-recovery links → /reset-password
 *  - Google / OAuth callbacks → /dashboard
 */
export function RecoveryHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    if (isEmailVerification) {
      navigate('/verified', { replace: true })
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password')
        return
      }

      if (event === 'SIGNED_IN' && session && isOAuthCallback()) {
        navigate('/dashboard', { replace: true })
        window.history.replaceState({}, '', `${window.location.pathname}#/dashboard`)
      }
    })

    if (isOAuthCallback()) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          navigate('/dashboard', { replace: true })
          window.history.replaceState({}, '', `${window.location.pathname}#/dashboard`)
        }
      })
    }

    return () => subscription.unsubscribe()
  }, [navigate])

  return null
}
