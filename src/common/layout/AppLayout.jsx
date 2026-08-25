import { lazy, Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppNav from './AppNav'
import AppFooter from './AppFooter'
import FloatingMessages from './FloatingMessages'
import { useAutoOpenQuickMatch } from '../utils/hooks'

const GroupDetailModal = lazy(() => import('../../features/group/GroupDetailModal'))
const MessagesModal = lazy(() => import('../../features/messages/MessagesModal'))
const QuickMatchModal = lazy(() => import('../../features/match/QuickMatchModal'))
const CreateGroupModal = lazy(() => import('../../features/create/CreateGroupModal'))

function RouteScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function AppLayout() {
  useAutoOpenQuickMatch()
  return (
    <div className="min-h-screen bg-canvas">
      <RouteScrollReset />
      <AppNav />

      <main className="flex flex-col can-hover:lg:ml-20 can-hover:lg:mr-24">
        <div className="mx-auto min-h-dvh w-full max-w-7xl px-4 py-12 lg:max-w-[clamp(80rem,100vw,90rem)] lg:px-2">
          <Outlet />
        </div>
        <AppFooter />
      </main>
      <FloatingMessages />
      <Suspense fallback={null}>
        <MessagesModal />
        <GroupDetailModal />
        <QuickMatchModal />
        <CreateGroupModal />
      </Suspense>
    </div>
  );
}
