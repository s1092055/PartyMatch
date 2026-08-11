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
      {/* ml/mr/pt 是幫桌機側邊欄／手機底部 Dock 留的版面間距，要跟著 DesktopSidebar／
          MobileHeader／MobileDock 實際顯示的條件（can-hover:lg:）走，不能只看寬度——
          不然沒有滑鼠 hover 能力的裝置（例如 iPad 橫向）會兩邊都留白／留空不對，
          內容不是被 Dock 蓋到就是多留一截用不到的空間 */}
      <main className="flex flex-col pt-14 can-hover:lg:ml-24 can-hover:lg:mr-24 can-hover:lg:pt-0">
        <div className="mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-7xl px-4 pt-12 pb-28 can-hover:lg:min-h-dvh can-hover:lg:py-12 lg:max-w-[clamp(80rem,100vw,120rem)] lg:px-8">
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
