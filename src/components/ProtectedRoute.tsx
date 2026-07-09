import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { Button } from '@/components/ui/Button'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  adminOnly?: boolean
  blockAdmin?: boolean
}

export function ProtectedRoute({ children, adminOnly = false, blockAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin, isBanned, loading, signOut } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (isBanned) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <h2 className="text-xl font-bold text-brand-900">{t('protectedRoute.suspended.title')}</h2>
        <p className="mt-3 text-brand-600">{t('protectedRoute.suspended.body')}</p>
        <Button className="mt-6" variant="outline" onClick={() => signOut()}>
          {t('common.signOut')}
        </Button>
      </div>
    )
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  if (blockAdmin && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}
