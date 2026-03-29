import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { LayoutGrid, LogOut, Megaphone, Menu, ShieldAlert, ShieldUser, TriangleAlert, UserCog } from 'lucide-react'
import logoUrl from '../../assets/Logo.svg'
import { useAdminAuthStore } from '../stores/useAdminAuthStore'
import { useGroupStore } from '../stores/useGroupStore'
import { ADMIN_LOGIN_PATH } from '../../app/AdminRoute'
import { Badge } from '../../components/ui/badge'
import { Drawer, DrawerContent, DrawerTitle } from '../../components/ui/drawer'

const ADMIN_NAV_ITEMS = [
  { key: 'overview', label: '平台概覽', icon: LayoutGrid },
  { key: 'messages', label: '系統訊息', icon: Megaphone },
  { key: 'disputes', label: '申訴裁定', icon: ShieldAlert },
  { key: 'accounts', label: '帳號管理', icon: UserCog },
  { key: 'platformReports', label: '使用者回報', icon: TriangleAlert },
]

export default function AdminDashboardLayout() {
  const navigate = useNavigate()
  const admin = useAdminAuthStore(s => s.admin)
  const [loggingOut, setLoggingOut] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pendingDisputeCount = useGroupStore(s => s.groups.filter(g => g.status === 'disputed').length)

  async function logout() {
    setLoggingOut(true)
    await useAdminAuthStore.getState().logout()
    navigate(ADMIN_LOGIN_PATH, { replace: true })
  }

  function selectTab(key) {
    setActiveTab(key)
    setMobileNavOpen(false)
  }

  const activeItem = ADMIN_NAV_ITEMS.find(item => item.key === activeTab)

  function renderNav() {
    return (
      <nav className="flex-1 space-y-1 px-4">
        {ADMIN_NAV_ITEMS.map(item => {
          const isActive = item.key === activeTab
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => selectTab(item.key)}
              className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-all hover:-translate-y-0.5 ${
                isActive
                  ? 'bg-brand font-extrabold text-white'
                  : 'font-bold text-ink-3 hover:bg-brand-subtle hover:text-brand'
              }`}
            >
              <item.icon size={18} strokeWidth={1.5} />
              {item.label}
              {item.key === 'disputes' && pendingDisputeCount > 0 && (
                <Badge
                  variant="destructive"
                  className={isActive ? 'ml-auto bg-white/20 text-white' : 'ml-auto'}
                >
                  {pendingDisputeCount}
                </Badge>
              )}
            </button>
          )
        })}
      </nav>
    )
  }

  function renderProfile() {
    return (
      <div className="space-y-3 border-t border-line px-4 py-5">
        <div className="flex items-center gap-3 px-1">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
            {admin?.name?.[0] ?? '管'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{admin?.name}</p>
            <p className="text-xs text-ink-3">管理員</p>
          </div>
        </div>
        <button
          onClick={logout}
          disabled={loggingOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ink-3 transition-colors hover:bg-raised hover:text-ink disabled:opacity-60"
        >
          <LogOut size={15} strokeWidth={1.5} />
          {loggingOut ? '登出中...' : '登出'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-raised">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <img src={logoUrl} alt="PartyMatch" className="h-7 w-auto" />
          <span className="flex items-center gap-1 rounded-full bg-brand-subtle px-2 py-0.5 text-2xs font-bold text-brand">
            <ShieldUser size={12} strokeWidth={1.5} />
            後台
          </span>
        </div>
        {renderNav()}
        {renderProfile()}
      </aside>

      <Drawer open={mobileNavOpen} onOpenChange={setMobileNavOpen} swipeDirection="left">
        <DrawerContent style={{ '--drawer-content-width': '16rem' }} className="data-[swipe-direction=left]:border-r-0 lg:hidden">
          <DrawerTitle className="sr-only">導覽選單</DrawerTitle>
          <div className="flex items-center gap-2 px-6 py-6">
            <img src={logoUrl} alt="PartyMatch" className="h-7 w-auto" />
            <span className="flex items-center gap-1 rounded-full bg-brand-subtle px-2 py-0.5 text-2xs font-bold text-brand">
              <ShieldUser size={12} strokeWidth={1.5} />
              後台
            </span>
          </div>
          {renderNav()}
          {renderProfile()}
        </DrawerContent>
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-surface px-4 py-5 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="開啟導覽選單"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-ink-2 transition-colors hover:bg-raised lg:hidden"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
          <div>
            <h1 className="text-xl font-black text-ink">{activeItem?.label}</h1>
            <p className="mt-0.5 text-sm text-ink-3">PartyMatch 平台管理</p>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet context={{ activeTab }} />
        </main>
      </div>
    </div>
  )
}
