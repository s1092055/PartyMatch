import { lazy, Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppNav from './AppNav'
import AppFooter from './AppFooter'
import MobileSearch from './MobileSearch'
import FloatingMessages from './FloatingMessages'
import BackToTopButton from './ScrollToTop'

const CreateGroupModal = lazy(() => import('../../features/create/CreateGroupModal'))
const GroupDetailModal = lazy(() => import('../../features/group/GroupDetailModal'))
const MessagesModal = lazy(() => import('../../features/messages/MessagesModal'))
const QuickMatchModal = lazy(() => import('../../features/match/QuickMatchModal'))

function RouteScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-canvas">
      <RouteScrollReset />
      <AppNav />
      <main className="flex min-h-screen flex-col pt-14 md:ml-24 md:pt-0">
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 md:px-6 lg:px-10 lg:py-12">
          <Outlet />
        </div>
        <AppFooter />
      </main>
      <MobileSearch />
      <FloatingMessages />
      <BackToTopButton />
      <Suspense fallback={null}>
        <MessagesModal />
        <CreateGroupModal />
        <GroupDetailModal />
        <QuickMatchModal />
      </Suspense>
    </div>
  )
}
