import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { WhatsAppButton } from './WhatsAppButton'
import { SoftBackground } from './SoftBackground'
import { ScrollProgress } from './ScrollProgress'
import { IntroOverlay } from './IntroOverlay'

export function Layout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <IntroOverlay />
      <ScrollProgress />
      <SoftBackground />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
