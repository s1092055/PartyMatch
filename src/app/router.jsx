import { useEffect } from 'react'
import { createBrowserRouter, useNavigate } from 'react-router-dom'
import AppLayout from '../shared/components/layout/AppLayout'
import HomePage from '../pages/home/HomePage'
import ExplorePage from '../pages/explore/ExplorePage'
import MatchResultPage from '../pages/match/MatchResultPage'
import GroupPage from '../pages/group/GroupPage'
import ManagePage from '../pages/manage/ManagePage'
import SubscriptionsPage from '../pages/subscriptions/SubscriptionsPage'
import AccountPage from '../pages/account/AccountPage'
import FavoritesPage from '../pages/favorites/FavoritesPage'
import LoginPage from '../pages/auth/login/LoginPage'
import RegisterPage from '../pages/auth/register/RegisterPage'
import ForgotPasswordPage from '../pages/auth/forgot-password/ForgotPasswordPage'
import ProtectedRoute from '../shared/components/route/ProtectedRoute'
import PublicOnlyRoute from '../shared/components/route/PublicOnlyRoute'
import DisclaimerPage from '../pages/legal/DisclaimerPage'
import TermsPage from '../pages/legal/TermsPage'
import PrivacyPage from '../pages/legal/PrivacyPage'

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
      { path: 'groups/:groupId', element: <GroupPage /> },
      { path: 'disclaimer',      element: <DisclaimerPage /> },
      { path: 'terms',           element: <TermsPage /> },
      { path: 'privacy',         element: <PrivacyPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'quick-match',         element: <QuickMatchRedirect /> },
          { path: 'quick-match/results', element: <MatchResultPage /> },
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
