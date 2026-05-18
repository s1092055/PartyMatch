import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../shared/components/layout/AppLayout'
import LandingPage from '../pages/landing/LandingPage'
import AboutPage from '../pages/about/AboutPage'
import ExplorePage from '../pages/explore/ExplorePage'
import QuickMatchPage from '../pages/quick-match/QuickMatchPage'
import QuickMatchResultPage from '../pages/quick-match/QuickMatchResultPage'
import GroupDetailPage from '../pages/group-detail/GroupDetailPage'
import CreateGroupPage from '../pages/create-group/CreateGroupPage'
import ManageGroupsPage from '../pages/manage-groups/ManageGroupsPage'
import MySubscriptionsPage from '../pages/my-subscriptions/MySubscriptionsPage'
import AccountCenterPage from '../pages/account/AccountCenterPage'
import FavoritesPage from '../pages/favorites/FavoritesPage'
import MessagesPage from '../pages/messages/MessagesPage'
import LoginPage from '../pages/auth/login/LoginPage'
import RegisterPage from '../pages/auth/register/RegisterPage'
import ForgotPasswordPage from '../pages/auth/forgot-password/ForgotPasswordPage'
import ProtectedRoute from '../shared/components/route/ProtectedRoute'
import PublicOnlyRoute from '../shared/components/route/PublicOnlyRoute'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
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
      { path: 'about',           element: <AboutPage /> },
      { path: 'groups/:groupId', element: <GroupDetailPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'quick-match',         element: <QuickMatchPage /> },
          { path: 'quick-match/results', element: <QuickMatchResultPage /> },
          { path: 'create-group',        element: <CreateGroupPage /> },
          { path: 'manage-groups',       element: <ManageGroupsPage /> },
          { path: 'my-subscriptions',    element: <MySubscriptionsPage /> },
          { path: 'favorites',           element: <FavoritesPage /> },
          { path: 'messages',            element: <MessagesPage /> },
          { path: 'account',             element: <AccountCenterPage /> },
        ],
      },
    ],
  },
])

export default router
