import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppNav from './AppNav'
import MobileSearch from './MobileSearch'
import FloatingMessages from './FloatingMessages'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-canvas">
      <ScrollToTop />
      <AppNav />
      <main className="min-h-screen pt-14 md:ml-24 md:pt-0">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </div>
      </main>
      <MobileSearch />
      <FloatingMessages />
    </div>
  )
}
