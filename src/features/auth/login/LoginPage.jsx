import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import AuthLayout, { AuthTitle, AuthInput, AuthError, PasswordToggle } from '../components/AuthLayout'
import { Button } from '../../../components/ui/button'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { toast } from '../../../common/utils/toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({})
  const canSubmit = email.trim() && password.trim() && !loading
  const fieldErrors = {
    email: email.trim() ? '' : '請輸入電子郵件',
    password: password.trim() ? '' : '請輸入密碼',
  }
  function markTouched(key) {
    setTouched(prev => (prev[key] ? prev : { ...prev, [key]: true }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) {
      setTouched({ email: true, password: true })
      return
    }
    setLoading(true)
    setError('')
    const homeImport      = import('../../home/HomePage').catch(() => {})
    const appLayoutImport = import('../../../common/layout/AppLayout').catch(() => {})
    const result = await useAuthStore.getState().login({ email, password })
    if (!result.ok) {
      setLoading(false)
      setError(result.error)
      return
    }
    const { from, reopenGroupModalId } = location.state ?? {}
    await (reopenGroupModalId ? appLayoutImport : homeImport)
    if (reopenGroupModalId) {
      navigate(from || '/', { replace: true, state: { reopenGroupModalId } });
    } else {
      navigate('/', { replace: true })
    }
    await new Promise(requestAnimationFrame)
    toast(`登入成功，歡迎${result.user.name ? ` ${result.user.name}` : ''}`)
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
          onBlur={() => markTouched('email')}
          error={touched.email ? fieldErrors.email : ''}
        />
        <AuthInput
          icon={Lock}
          label="密碼"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="請輸入密碼"
          value={password}
          onChange={setPassword}
          onBlur={() => markTouched('password')}
          error={touched.password ? fieldErrors.password : ''}
          trailing={<PasswordToggle visible={showPassword} onClick={() => setShowPassword(v => !v)} />}
        />

        <AuthError message={error} />

        <Button type="submit" size="lg" className="mt-3 h-[3.75rem] w-full rounded-2xl text-lg" disabled={!email.trim() || !password.trim()} loading={loading}>
          登入
        </Button>
      </form>

      <p className="mt-8 text-center text-base font-medium text-ink-3">
        還沒有帳號？
        <Link to="/register" state={location.state} className="ml-2 font-extrabold text-brand hover:text-brand-hover">
          立即註冊
        </Link>
      </p>
    </AuthLayout>
  )
}
