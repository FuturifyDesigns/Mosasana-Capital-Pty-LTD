const OAUTH_RETURN_KEY = 'mosasana_oauth_return'

const DEFAULT_RETURN = '/login'

export function setOAuthReturnPath(path: string) {
  try {
    sessionStorage.setItem(OAUTH_RETURN_KEY, path.startsWith('/') ? path : `/${path}`)
  } catch {
    /* ignore */
  }
}

export function getOAuthReturnPath(): string {
  try {
    return sessionStorage.getItem(OAUTH_RETURN_KEY) || DEFAULT_RETURN
  } catch {
    return DEFAULT_RETURN
  }
}

export function clearOAuthReturnPath() {
  try {
    sessionStorage.removeItem(OAUTH_RETURN_KEY)
  } catch {
    /* ignore */
  }
}

/** Parse Supabase OAuth callback params from the URL hash or query string. */
export function getAuthCallbackParams(): URLSearchParams | null {
  const hash = window.location.hash.slice(1)
  if (hash && !hash.startsWith('/') && (hash.includes('access_token=') || hash.includes('error='))) {
    return new URLSearchParams(hash)
  }

  const search = window.location.search.slice(1)
  if (search && (search.includes('access_token=') || search.includes('error='))) {
    return new URLSearchParams(search)
  }

  return null
}

export function isOAuthSuccessCallback(params: URLSearchParams): boolean {
  return params.has('access_token') && !params.has('error')
}

export function isOAuthErrorCallback(params: URLSearchParams): boolean {
  return params.has('error')
}

export function isOAuthCancelled(params: URLSearchParams): boolean {
  const code = params.get('error_code') || params.get('error') || ''
  return code === 'access_denied' || /access denied|cancel/i.test(params.get('error_description') || '')
}

export function cleanAuthCallbackFromUrl(returnPath: string) {
  const base = `${window.location.pathname}${window.location.search}`
  window.history.replaceState({}, '', `${base}#${returnPath.startsWith('/') ? returnPath : `/${returnPath}`}`)
}
