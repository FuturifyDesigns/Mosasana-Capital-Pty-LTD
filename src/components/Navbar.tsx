import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, LogOut, LayoutDashboard, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from './Logo'
import { Button } from './ui/Button'
import { NotificationBell } from './NotificationBell'
import { LanguageToggle } from './LanguageToggle'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import type { TranslationKey } from '@/lib/i18n'

const navLinks: { to: string; labelKey: TranslationKey }[] = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/about', labelKey: 'nav.about' },
  { to: '/contact', labelKey: 'nav.contact' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, profile, isAdmin, signOut } = useAuth()
  const { t } = useLanguage()

  const displayName = (profile?.full_name?.trim() || user?.email || '').trim()
  const firstName = displayName.split(/[\s@]/)[0] || 'there'
  const initials = (displayName || '?').charAt(0).toUpperCase()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-brand-100 text-brand-800' : 'text-brand-700 hover:bg-brand-50 hover:text-brand-900'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-brand-100/80 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3">
        <Logo className="h-10 sm:h-12" />

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {t(link.labelKey)}
            </NavLink>
          ))}
          {user && !isAdmin && (
            <NavLink to="/apply" className={linkClass}>
              {t('nav.applyForLoan')}
            </NavLink>
          )}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageToggle compact />
          {user ? (
            <>
              {!isAdmin && (
                <NavLink to="/dashboard" className={linkClass}>
                  <span className="flex items-center gap-1.5">
                    <LayoutDashboard className="h-4 w-4" />
                    {t('nav.dashboard')}
                  </span>
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/admin" className={linkClass}>
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-4 w-4" />
                    {t('nav.admin')}
                  </span>
                </NavLink>
              )}
              <NotificationBell />
              <div
                className="flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 py-1 pl-1 pr-3"
                title={t('common.signedInAs', { name: displayName })}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-500 text-xs font-bold text-white">
                  {initials}
                </span>
                <span className="max-w-[9rem] truncate text-sm font-medium text-brand-800">
                  {t('common.hi', { name: firstName })}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
                {t('common.signOut')}
              </Button>
            </>
          ) : (
            <Link to="/account">
              <Button size="sm">{t('common.getStarted')}</Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle compact />
          {!user && (
            <Link to="/account">
              <Button size="sm" className="px-3">
                {t('common.getStarted')}
              </Button>
            </Link>
          )}
          <button
            className="rounded-lg p-2 text-brand-700"
            onClick={() => setOpen(!open)}
            aria-label={t('common.toggleMenu')}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-brand-100 bg-white md:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {user && (
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 p-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-500 text-sm font-bold text-white">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-900">
                      {t('common.hi', { name: firstName })}
                    </p>
                    <p className="truncate text-xs text-brand-500">{displayName}</p>
                  </div>
                  </div>
                  <NotificationBell />
                </div>
              )}
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={linkClass}
                  onClick={() => setOpen(false)}
                >
                  {t(link.labelKey)}
                </NavLink>
              ))}
              {user && !isAdmin && (
                <NavLink to="/apply" className={linkClass} onClick={() => setOpen(false)}>
                  {t('nav.applyForLoan')}
                </NavLink>
              )}
              {user ? (
                <>
                  {!isAdmin && (
                    <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>
                      {t('nav.dashboard')}
                    </NavLink>
                  )}
                  {isAdmin && (
                    <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>
                      {t('nav.adminPortal')}
                    </NavLink>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => signOut()}>
                    {t('common.signOut')}
                  </Button>
                </>
              ) : (
                <Link to="/account" onClick={() => setOpen(false)}>
                  <Button size="sm" className="mt-2 w-full">
                    {t('common.getStarted')}
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
