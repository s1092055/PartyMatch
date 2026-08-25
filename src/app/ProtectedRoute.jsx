import { useState } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { LogIn, Lock } from 'lucide-react'
import { useAuthStore } from '../common/stores/useAuthStore'
import { useScrollLock } from '../common/utils/hooks'

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate()
  const [cancelled, setCancelled] = useState(false)
  const authenticated = useAuthStore(s => s.loggedIn)
  const showModal = !authenticated && !cancelled

  useScrollLock(showModal)

  if (showModal) {
    return (
      <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-popover text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-subtle mx-auto">
            <Lock strokeWidth={1.5} size={22} className="text-brand" />
          </div>
          <h2 className="text-lg font-extrabold text-ink">需要登入才能繼續</h2>
          <p className="mt-1 text-sm font-medium text-ink-3">請先登入，才能使用此功能。</p>
          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setCancelled(true)}
              className="flex flex-1 items-center justify-center rounded-2xl border border-line py-3 text-sm font-bold text-ink-3 transition-all hover:-translate-y-0.5 hover:bg-raised hover:text-ink"
            >
              取消
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-hover"
            >
              <LogIn strokeWidth={1.5} size={16} />
              登入
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!authenticated) return <Navigate to="/" replace />

  return children ?? <Outlet />
}
