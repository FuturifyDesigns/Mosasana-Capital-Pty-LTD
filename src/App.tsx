import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { ContentProvider } from '@/context/ContentContext'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import { AboutPage } from '@/pages/AboutPage'
import { ApplyPage } from '@/pages/ApplyPage'
import { ContactPage } from '@/pages/ContactPage'
import { AuthPage } from '@/pages/AuthPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { VerifiedPage } from '@/pages/VerifiedPage'
import { RecoveryHandler } from '@/components/RecoveryHandler'
import { DashboardPage } from '@/pages/DashboardPage'
import { AdminPage } from '@/pages/AdminPage'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ContentProvider>
        <HashRouter>
        <RecoveryHandler />
        <Routes>
          <Route path="verified" element={<VerifiedPage />} />
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route
              path="apply"
              element={
                <ProtectedRoute>
                  <ApplyPage />
                </ProtectedRoute>
              }
            />
            <Route path="contact" element={<ContactPage />} />
            <Route path="account" element={<AuthPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
        </HashRouter>
        </ContentProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
