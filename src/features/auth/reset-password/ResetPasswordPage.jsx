import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, ShieldAlert } from 'lucide-react'
import AuthLayout, { AuthTitle, AuthInput, AuthError, PasswordToggle } from '../components/AuthLayout'
import { Button } from '../../../components/ui/button'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { toast } from '../../../common/utils/toast'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({})

  const fieldErrors = {
    password: password.length < 8 ? '密碼至少需要 8 個字元'
      : !/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password) ? '密碼需至少包含英文字母與數字' : '',
    confirmPassword: confirmPassword === password ? '' : '兩次輸入的密碼不一致',
  }
  const canSubmit = !fieldErrors.password && !fieldErrors.confirmPassword && !loading

  function markTouched(key) {
    setTouched(prev => (prev[key] ? prev : { ...prev, [key]: true }))
  }

  if (!token) {
    return (
      <AuthLayout backTo="/login">
        <div className="mt-14 flex flex-col items-center text-center">
          <ShieldAlert size={48} strokeWidth={1.5} className="text-danger-text" />
          <h1 className="mt-4 text-2xl font-extrabold text-ink">連結無效</h1>
          <p className="mt-3 text-base font-medium text-ink-3">這個重設密碼連結不完整，請重新申請一次。</p>
        </div>
        <p className="mt-8 text-center text-base font-medium text-ink-3">
          <Link to="/forgot-password" className="font-extrabold text-brand hover:text-brand-hover">
            重新申請重設密碼
          </Link>
        </p>
      </AuthLayout>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) {
      setTouched({ password: true, confirmPassword: true })
      return
    }
    setLoading(true)
    setError('')
    const result = await useAuthStore.getState().resetPassword({ token, newPassword: password })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate('/login', { replace: true })
    toast('密碼已重設，請使用新密碼登入')
  }

  return (
    <AuthLayout backTo="/login">
      <div className="mt-14">
        <AuthTitle>重設密碼</AuthTitle>
      </div>
      <p className="mt-4 text-base font-medium text-ink-3">請輸入你的新密碼。</p>

      <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
        <AuthInput
          icon={Lock}
          label="新密碼"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="至少 8 碼，需包含英文字母與數字"
          value={password}
          onChange={setPassword}
          onBlur={() => markTouched('password')}
          error={touched.password ? fieldErrors.password : ''}
          trailing={<PasswordToggle visible={showPassword} onClick={() => setShowPassword(v => !v)} />}
        />
        <AuthInput
          icon={Lock}
          label="確認新密碼"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="再次輸入新密碼"
          value={confirmPassword}
          onChange={setConfirmPassword}
          onBlur={() => markTouched('confirmPassword')}
          error={touched.confirmPassword ? fieldErrors.confirmPassword : ''}
        />

        <AuthError message={error} />

        <Button type="submit" size="lg" className="mt-3 h-[3.75rem] w-full rounded-2xl text-lg" disabled={!password || !confirmPassword} loading={loading}>
          重設密碼
        </Button>
      </form>
    </AuthLayout>
  )
}
