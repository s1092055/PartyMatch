import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import AuthLayout, { AuthInput, AuthDivider, AuthError, GoogleMark, PasswordToggle } from '../components/AuthLayout'
import Button from '../../../shared/ui/Button'
import { useAuthStore } from '../../../shared/stores/useAuthStore'
import { toast } from '../../../shared/utils/toast'

function safeRedirect(path) {
  return path?.startsWith('/') ? path : '/'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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
    toast('登入成功！歡迎回來')
    navigate(safeRedirect(searchParams.get('redirectTo')), { replace: true })
  }

  return (
    <AuthLayout>
      <div className="mt-12">
        <h1 className="text-4xl font-extrabold leading-tight text-ink md:text-4xl">登入 PartyMatch</h1>
        <p className="mt-5 text-base font-medium leading-relaxed text-ink-3">
          登入後即可探索共享訂閱群組、快速搜尋並管理你的訂閱。
        </p>
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
