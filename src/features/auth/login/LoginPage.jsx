import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import AuthLayout, { AuthTitle, AuthInput, AuthDivider, AuthError, GoogleMark, PasswordToggle } from '../components/AuthLayout'
import { Button } from '../../../components/ui/button'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { toast } from '../../../common/utils/toast'
import { ADMIN_HOME_PATH } from '../../../app/AdminRoute'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const canSubmit = email.trim() && password.trim() && !loading

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    const result = await useAuthStore.getState().login({ email, password })
    if (!result.ok) {
      setLoading(false)
      setError(result.error)
      return
    }
    toast(`登入成功，歡迎${result.user.name ? ` ${result.user.name}` : ''}`)
    // 管理員不參與一般使用者流程（探索/建立/加入群組），登入後直接進管理員後台
    navigate(result.user.isAdmin ? ADMIN_HOME_PATH : '/', { replace: true })
  }

  return (
    <AuthLayout>
      <div className="mt-12">
        <AuthTitle>登入 PartyMatch</AuthTitle>
      </div>

      <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
        <AuthInput
          icon={Mail}
          label="電子郵件"
          type="email"
          autoComplete="email"
          placeholder="請輸入電子郵件"
          value={email}
          onChange={setEmail}
        />
        <AuthInput
          icon={Lock}
          label="密碼"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="請輸入密碼"
          value={password}
          onChange={setPassword}
          trailing={<PasswordToggle visible={showPassword} onClick={() => setShowPassword(v => !v)} />}
        />

        <div className="flex items-center justify-end gap-4">
          <Link to="/forgot-password" className="text-sm font-bold text-brand hover:text-brand-hover">
            忘記密碼？
          </Link>
        </div>

        <AuthError message={error} />

        <Button type="submit" size="lg" className="h-[3.75rem] w-full text-lg" disabled={!email.trim() || !password.trim()} loading={loading}>
          登入
        </Button>
      </form>

      <AuthDivider />

      <Button
        type="button"
        variant="ghost"
        size="lg"
        disabled
        className="h-[3.5rem] w-full cursor-not-allowed border border-line bg-surface text-base text-ink-3"
      >
        <GoogleMark />
        以 Google 繼續
        <span className="rounded-full bg-raised px-2 py-0.5 text-2xs font-bold text-ink-3">即將推出</span>
      </Button>

      <p className="mt-8 text-center text-base font-medium text-ink-3">
        還沒有帳號？
        <Link to="/register" className="ml-2 font-extrabold text-brand hover:text-brand-hover">
          立即註冊
        </Link>
      </p>
    </AuthLayout>
  )
}
