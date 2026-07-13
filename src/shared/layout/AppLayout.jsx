import { lazy, Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppNav from './AppNav'
import AppFooter from './AppFooter'
import FloatingMessages from './FloatingMessages'
import BackToTopButton from './ScrollToTop'

const GroupDetailModal = lazy(() => import('../../features/group/GroupDetailModal'))
const MessagesModal = lazy(() => import('../../features/messages/MessagesModal'))

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
      <main className="flex flex-col pt-14 md:ml-24 md:pt-0">
        <div className="mx-auto min-h-dvh w-full max-w-7xl px-4 pt-12 pb-28 md:py-12 md:px-6 lg:max-w-[clamp(80rem,100vw,100rem)] lg:px-10">
          <Outlet />
        </div>
        <AppFooter />
      </main>
      <FloatingMessages />
      <BackToTopButton />
      <Suspense fallback={null}>
        <MessagesModal />
        <GroupDetailModal />
      </Suspense>
    </div>
  )
}
