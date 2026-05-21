import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../shared/components/layout/AppLayout'
import HomePage from '../pages/home/HomePage'
import ExplorePage from '../pages/explore/ExplorePage'
import MatchPage from '../pages/match/MatchPage'
import MatchResultPage from '../pages/match/MatchResultPage'
import GroupPage from '../pages/group/GroupPage'
import CreatePage from '../pages/create/CreatePage'
import ManagePage from '../pages/manage/ManagePage'
import SubscriptionsPage from '../pages/subscriptions/SubscriptionsPage'
import AccountPage from '../pages/account/AccountPage'
import FavoritesPage from '../pages/favorites/FavoritesPage'
import LoginPage from '../pages/auth/login/LoginPage'
import RegisterPage from '../pages/auth/register/RegisterPage'
import ForgotPasswordPage from '../pages/auth/forgot-password/ForgotPasswordPage'
import ProtectedRoute from '../shared/components/route/ProtectedRoute'
import PublicOnlyRoute from '../shared/components/route/PublicOnlyRoute'

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
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'quick-match',         element: <MatchPage /> },
          { path: 'quick-match/results', element: <MatchResultPage /> },
          { path: 'create-group',        element: <CreatePage /> },
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
