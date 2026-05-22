import { useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Lock, UserPlus } from 'lucide-react'
import { isAuthenticated } from '../../stores/authStore'
import { useScrollLock } from '../../utils/hooks'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [cancelled, setCancelled] = useState(false)
  const authenticated = isAuthenticated()
  const showModal = !authenticated && !cancelled

  useScrollLock(showModal)

  if (showModal) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}`)
    return (
      <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-subtle">
            <Lock size={22} className="text-brand" />
          </div>
          <h2 className="text-lg font-extrabold text-ink">需要登入才能繼續</h2>
          <p className="mt-1 text-sm font-medium text-ink-3">請先登入或註冊帳號，才能使用此功能。</p>
          <div className="mt-5 flex gap-2">
            <button
              onClick={() => navigate(`/register?redirectTo=${redirectTo}`)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
            >
              <UserPlus size={16} />
              註冊
            </button>
            <button
              onClick={() => navigate(`/login?redirectTo=${redirectTo}`)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-line py-3 text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-brand"
            >
              <LogIn size={16} />
              登入
            </button>
          </div>
          <button
            onClick={() => setCancelled(true)}
            className="mt-2 w-full rounded-2xl py-2.5 text-sm font-bold text-ink-3 transition-colors hover:bg-raised hover:text-ink"
          >
            取消
          </button>
        </div>
      </div>
    )
  }

  if (!authenticated) return <Navigate to="/" replace />

  return children ?? <Outlet />
}
