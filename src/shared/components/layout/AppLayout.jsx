import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import MobileSearch from './MobileSearch'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-canvas">
      <ScrollToTop />
      <Sidebar />
      <Topbar />
      <main className="min-h-screen pt-14 md:ml-20 md:pt-0">
        <div className="px-4 py-6 md:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </div>
      </main>
      <MobileSearch />
    </div>
  )
}
