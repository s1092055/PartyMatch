import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'
import AdminRoute, { ADMIN_HOME_PATH } from './AdminRoute'
import { GroupRedirect, MyGroupsLegacyRedirect, QuickMatchRedirect } from './redirects'

function routeElement(loader) {
  const Component = lazy(loader)
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <Component />
    </Suspense>
  )
}

const router = createBrowserRouter([
  { path: '/', element: routeElement(() => import('../features/home/HomePage')) },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login',           element: routeElement(() => import('../features/auth/login/LoginPage')) },
      { path: '/register',        element: routeElement(() => import('../features/auth/register/RegisterPage')) },
      { path: '/forgot-password', element: routeElement(() => import('../features/auth/forgot-password/ForgotPasswordPage')) },
    ],
  },
  {
    path: '/',
    element: routeElement(() => import('../common/layout/AppLayout')),
    children: [
      { path: 'explore',         element: routeElement(() => import('../features/explore/ExplorePage')) },
      { path: 'groups/:groupId', element: <GroupRedirect /> },
      { path: 'disclaimer',      element: routeElement(() => import('../features/legal/DisclaimerPage')) },
      { path: 'terms',           element: routeElement(() => import('../features/legal/TermsPage')) },
      { path: 'privacy',         element: routeElement(() => import('../features/legal/PrivacyPage')) },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'my-groups',           element: <MyGroupsLegacyRedirect /> },
          { path: 'my-subscriptions',    element: routeElement(() => import('../features/subscriptions/SubscriptionsPage')) },
          { path: 'manage-groups',       element: routeElement(() => import('../features/manage-groups/ManageGroupsPage')) },
          { path: 'favorites',           element: routeElement(() => import('../features/favorites/FavoritesPage')) },
          { path: 'account',             element: routeElement(() => import('../features/account/AccountPage')) },
        ],
      },
    ],
  },
  { path: '/quick-match', element: <QuickMatchRedirect /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/create-group', element: routeElement(() => import('../features/create/CreateGroupPage')) },
    ],
  },
  {
    element: <AdminRoute />,
    children: [
      {
        path: ADMIN_HOME_PATH,
        element: routeElement(() => import('../common/layout/AdminDashboardLayout')),
        children: [
          { index: true, element: routeElement(() => import('../features/admin/AdminDashboardPage')) },
        ],
      },
    ],
  },
])

export default router
