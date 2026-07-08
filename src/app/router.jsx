import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'
import { GroupRedirect, SubscriptionsRedirect, ManageRedirect } from './redirects'

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
          { path: 'my-groups',           element: routeElement(() => import('../features/my-groups/MyGroupsPage')) },
          { path: 'my-subscriptions',    element: <SubscriptionsRedirect /> },
          { path: 'manage-groups',       element: <ManageRedirect /> },
          { path: 'favorites',           element: routeElement(() => import('../features/favorites/FavoritesPage')) },
          { path: 'account',             element: routeElement(() => import('../features/account/AccountPage')) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/create-group', element: routeElement(() => import('../features/create/CreateGroupPage')) },
      { path: '/quick-match',  element: routeElement(() => import('../features/match/QuickMatchPage')) },
    ],
  },
])

export default router
