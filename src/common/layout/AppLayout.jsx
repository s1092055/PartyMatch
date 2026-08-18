import { lazy, Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppNav from './AppNav'
import AppFooter from './AppFooter'
import FloatingMessages from './FloatingMessages'

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
      {/* ml/mr 是留給桌機 DesktopSidebar 那條「持續佔用版面」的側邊欄，只在真的有 hover
          能力的裝置顯示（can-hover:lg:）——手機／iPad 這類沒有 hover 能力的裝置一律改用
          TabletSidebarDrawer 的觸發按鈕 + 點開才出現的 Drawer，不會持續佔用版面，不需要
          另外留白，上下也不用再幫 MobileHeader／MobileDock 保留固定間距（兩者已移除） */}
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
      </Suspense>
    </div>
  )
}
