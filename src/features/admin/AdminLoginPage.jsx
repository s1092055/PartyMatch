import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Lock, ShieldUser } from 'lucide-react'
import logoUrl from '../../assets/Logo.svg'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useAdminAuthStore } from '../../common/stores/useAdminAuthStore'
import { ADMIN_HOME_PATH } from '../../app/AdminRoute'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const loggedIn = useAdminAuthStore(s => s.loggedIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (loggedIn) return <Navigate to={ADMIN_HOME_PATH} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password.trim() || loading) return
    setLoading(true)
    setError('')
    const result = await useAdminAuthStore.getState().login({ email: email.trim(), password })
    if (!result.ok) {
      setLoading(false)
      setError(result.error)
      return
    }
    navigate(ADMIN_HOME_PATH, { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 text-ink">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src={logoUrl} alt="PartyMatch" className="h-12 w-12" />
          <div className="flex items-center gap-1.5 rounded-full bg-brand-subtle px-3 py-1 text-xs font-bold text-brand">
            <ShieldUser size={13} strokeWidth={1.5} />
            管理員後台
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-3">管理員 Email</span>
            <Input
              type="email"
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-3">密碼</span>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="請輸入密碼"
            />
          </label>

          {error && (
            <p className="flex items-center gap-1.5 text-sm text-danger-text">
              <Lock size={13} strokeWidth={1.5} /> {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-lg"
            disabled={!email.trim() || !password.trim() || loading}
            loading={loading}
          >
            登入
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-4">
          此帳號跟一般使用者帳號完全獨立，僅供平台管理人員使用
        </p>
      </div>
    </main>
  )
}
