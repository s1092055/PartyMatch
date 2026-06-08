import { useEffect } from 'react'
import { createBrowserRouter, useNavigate } from 'react-router-dom'
import AppLayout from '../shared/components/layout/AppLayout'
import HomePage from '../features/home/HomePage'
import ExplorePage from '../features/explore/ExplorePage'
import ManagePage from '../features/manage/ManagePage'
import SubscriptionsPage from '../features/subscriptions/SubscriptionsPage'
import AccountPage from '../features/account/AccountPage'
import FavoritesPage from '../features/favorites/FavoritesPage'
import LoginPage from '../features/auth/login/LoginPage'
import RegisterPage from '../features/auth/register/RegisterPage'
import ForgotPasswordPage from '../features/auth/forgot-password/ForgotPasswordPage'
import ProtectedRoute from '../shared/components/route/ProtectedRoute'
import PublicOnlyRoute from '../shared/components/route/PublicOnlyRoute'
import DisclaimerPage from '../features/legal/DisclaimerPage'
import TermsPage from '../features/legal/TermsPage'
import PrivacyPage from '../features/legal/PrivacyPage'

function CreateGroupRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pm:open-create'))
    navigate('/manage-groups', { replace: true })
  }, [])
  return null
}

function QuickMatchRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pm:open-match'))
    navigate('/explore', { replace: true })
  }, [])
  return null
}

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login',           element: <LoginPage /> },
      { path: '/register',        element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: 'explore',         element: <ExplorePage /> },
      { path: 'disclaimer',      element: <DisclaimerPage /> },
      { path: 'terms',           element: <TermsPage /> },
      { path: 'privacy',         element: <PrivacyPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'quick-match',         element: <QuickMatchRedirect /> },
          { path: 'create-group',        element: <CreateGroupRedirect /> },
          { path: 'manage-groups',       element: <ManagePage /> },
          { path: 'my-subscriptions',    element: <SubscriptionsPage /> },
          { path: 'favorites',           element: <FavoritesPage /> },
          { path: 'account',             element: <AccountPage /> },
        ],
      },
    ],
  },
])

export default router
