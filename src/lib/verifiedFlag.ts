// Captured at module-evaluation time — BEFORE the Supabase client asynchronously
// strips the auth params from the URL. This lets us reliably detect that the user
// arrived via an email-confirmation link (which includes `type=signup`) so we can
// route them to the "email verified" page even on GitHub Pages / HashRouter.
function detect(): boolean {
  try {
    const hash = window.location.hash || ''
    const search = window.location.search || ''
    return (
      /type=signup/.test(hash) ||
      /type=signup/.test(search) ||
      /[?&]verified=1/.test(search)
    )
  } catch {
    return false
  }
}

export const isEmailVerification = detect()
