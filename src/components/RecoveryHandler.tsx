import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  cleanVerificationFromUrl,
  clearEmailVerificationFlag,
  isEmailVerification,
} from '@/lib/verifiedFlag'
import { useToast } from '@/context/ToastContext'
import {
  cleanAuthCallbackFromUrl,
  clearOAuthReturnPath,
  getAuthCallbackParams,
  getOAuthReturnPath,
  isOAuthCancelled,
  isOAuthErrorCallback,
  isOAuthSuccessCallback,
} from '@/lib/oauthReturn'

function isOAuthCallback(): boolean {
  const params = getAuthCallbackParams()
  return params != null && isOAuthSuccessCallback(params)
}

/**
 * Handles Supabase auth-link arrivals:
 *  - Email confirmation links (contain `type=signup` / `?verified=1`) → /verified
 *  - Password-recovery links → /reset-password
 *  - Google / OAuth success → /dashboard
 *  - Google / OAuth cancel or error → back to login or register
 */
export function RecoveryHandler() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  useEffect(() => {
    if (isEmailVerification()) {
      clearEmailVerificationFlag()
      cleanVerificationFromUrl()
      navigate('/verified', { replace: true })
    }

    const callbackParams = getAuthCallbackParams()
    if (callbackParams && isOAuthErrorCallback(callbackParams)) {
      const returnPath = getOAuthReturnPath()
      const cancelled = isOAuthCancelled(callbackParams)

      cleanAuthCallbackFromUrl(returnPath)
      clearOAuthReturnPath()
      navigate(returnPath, { replace: true })

      showToast(
        cancelled
          ? 'Google sign-in was cancelled. You can try again or use email instead.'
          : 'Google sign-in did not complete. Please try again.',
        cancelled ? 'info' : 'error',
      )
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password')
        return
      }

      if (event === 'SIGNED_IN' && session && isOAuthCallback()) {
        clearOAuthReturnPath()
        navigate('/dashboard', { replace: true })
        window.history.replaceState({}, '', `${window.location.pathname}#/dashboard`)
      }
    })

    if (isOAuthCallback()) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          clearOAuthReturnPath()
          navigate('/dashboard', { replace: true })
          window.history.replaceState({}, '', `${window.location.pathname}#/dashboard`)
        }
      })
    }

    return () => subscription.unsubscribe()
  }, [navigate, showToast])

  return null
}
