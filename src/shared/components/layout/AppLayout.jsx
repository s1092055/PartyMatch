import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppNav from './AppNav'
import AppFooter from './AppFooter'
import MobileSearch from './MobileSearch'
import FloatingMessages from './FloatingMessages'
import BackToTopButton from './ScrollToTop'
import CreateGroupModal from '../../../pages/create/CreateGroupModal'
import GroupDetailModal from '../../../pages/group/GroupDetailModal'
import MessagesModal from '../../../pages/messages/MessagesModal'
import QuickMatchModal from '../../../pages/match/QuickMatchModal'

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
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </div>
        <AppFooter />
      </main>
      <MobileSearch />
      <FloatingMessages />
      <MessagesModal />
      <BackToTopButton />
      <CreateGroupModal />
      <GroupDetailModal />
      <QuickMatchModal />
    </div>
  )
}
