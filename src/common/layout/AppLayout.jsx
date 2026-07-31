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
      <main className="flex flex-col pt-14 lg:ml-24 lg:mr-24 lg:pt-0">
        <div className="mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-7xl px-4 pt-12 pb-28 lg:min-h-dvh lg:py-12 lg:max-w-[clamp(80rem,100vw,100rem)] lg:px-10">
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
