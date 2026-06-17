import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'
import { CreateGroupRedirect, GroupRedirect, QuickMatchRedirect } from './redirects'

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
    element: routeElement(() => import('../shared/layout/AppLayout')),
    children: [
      { path: 'explore',         element: routeElement(() => import('../features/explore/ExplorePage')) },
      { path: 'groups/:groupId', element: <GroupRedirect /> },
      { path: 'disclaimer',      element: routeElement(() => import('../features/legal/DisclaimerPage')) },
      { path: 'terms',           element: routeElement(() => import('../features/legal/TermsPage')) },
      { path: 'privacy',         element: routeElement(() => import('../features/legal/PrivacyPage')) },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'quick-match',         element: <QuickMatchRedirect /> },
          { path: 'create-group',        element: <CreateGroupRedirect /> },
          { path: 'manage-groups',       element: routeElement(() => import('../features/manage/ManagePage')) },
          { path: 'my-subscriptions',    element: routeElement(() => import('../features/subscriptions/SubscriptionsPage')) },
          { path: 'favorites',           element: routeElement(() => import('../features/favorites/FavoritesPage')) },
          { path: 'account',             element: routeElement(() => import('../features/account/AccountPage')) },
        ],
      },
    ],
  },
])

export default router
