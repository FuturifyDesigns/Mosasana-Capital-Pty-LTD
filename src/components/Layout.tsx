import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { WhatsAppButton } from './WhatsAppButton'
import { SoftBackground } from './SoftBackground'
import { ScrollProgress } from './ScrollProgress'
import { CookieConsent } from './CookieConsent'
import { ExitIntentPopup } from './ExitIntentPopup'
import { AdminEditBanner } from './AdminEditBanner'

export function Layout() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <ScrollProgress />
      <SoftBackground />
      <AdminEditBanner />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <CookieConsent />
      <ExitIntentPopup />
    </div>
  )
}
