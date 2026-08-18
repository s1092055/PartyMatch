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
      {/* pt/pb 是幫 MobileHeader／MobileDock 留的版面間距，這兩個元件只看寬度就會隱藏
          （lg:hidden，不疊 can-hover:——iPad 這類沒有 hover 能力的裝置改用
          TabletSidebarDrawer 的觸發按鈕，不再用 MobileHeader／MobileDock），留白要跟著
          同一個條件退掉，不然 iPad 版上下會多留一截用不到的空間。ml/mr 則是留給桌機
          DesktopSidebar 那條「持續佔用版面」的側邊欄，這個仍然只在真的有 hover 能力的
          裝置顯示（can-hover:lg:）——iPad 版的側邊欄是點開才出現的 Drawer，不會持續佔用
          版面，不需要另外留白 */}
      <main className="flex flex-col pt-14 lg:pt-0 can-hover:lg:ml-20 can-hover:lg:mr-24">
        <div className="mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-7xl px-4 pt-12 pb-28 lg:min-h-dvh lg:py-12 lg:max-w-[clamp(80rem,100vw,90rem)] lg:px-2">
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
