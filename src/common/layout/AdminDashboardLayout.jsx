import { Outlet } from 'react-router-dom'
import { LogOut, ShieldUser } from 'lucide-react'
import logoUrl from '../../assets/Logo.svg'
import { useAuthStore } from '../stores/useAuthStore'
import { useLogout } from '../utils/hooks'

// 管理員後台獨立的極簡版 layout，不共用一般使用者那套探索/建立群組/訊息中心的 nav——
// 管理員不參與一般群組流程，塞那些功能進來只會是雜訊
export default function AdminDashboardLayout() {
  const user = useAuthStore(s => s.user)
  const { loggingOut, logout } = useLogout()

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:px-8">
        <div className="flex items-center gap-2.5">
          <img src={logoUrl} alt="PartyMatch" className="h-7 w-auto" />
          <span className="flex items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-1 text-xs font-bold text-brand">
            <ShieldUser size={13} strokeWidth={1.5} />
            管理員後台
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-semibold text-ink-3 md:inline">{user?.name}</span>
          <button
            onClick={logout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink-3 transition-colors hover:bg-raised hover:text-ink disabled:opacity-60"
          >
            <LogOut size={14} strokeWidth={1.5} />
            {loggingOut ? '登出中...' : '登出'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
