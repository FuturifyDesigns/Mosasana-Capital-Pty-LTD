import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Home, MessageCircle } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

export function NotFoundPage() {
  const { t } = useLanguage()
  const { user, isAdmin } = useAuth()
  const applyTarget = user ? (isAdmin ? '/admin' : '/apply') : '/register'

  return (
    <section className="relative flex min-h-[60vh] items-center justify-center px-4 py-16 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-10 h-56 w-56 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 h-56 w-56 rounded-full bg-brand-100/60 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-lg rounded-3xl border border-brand-100 bg-white/90 p-8 text-center shadow-xl backdrop-blur-sm sm:p-10"
      >
        <div className="flex justify-center">
          <Logo className="h-16 sm:h-20" />
        </div>
        <p className="mt-6 font-display text-6xl font-bold text-brand-600 sm:text-7xl">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-brand-900 sm:text-3xl">
          {t('common.notFound.title')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-600 sm:text-base">
          {t('common.notFound.body')}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/">
            <Button className="w-full sm:w-auto">
              <Home className="h-4 w-4" />
              {t('common.notFound.home')}
            </Button>
          </Link>
          <Link to={applyTarget}>
            <Button variant="secondary" className="w-full sm:w-auto">
              {t('common.getStarted')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Link
          to="/contact"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-900"
        >
          <MessageCircle className="h-4 w-4" />
          {t('common.notFound.contact')}
        </Link>
      </motion.div>
    </section>
  )
}
