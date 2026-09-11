import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MailCheck } from 'lucide-react'
import AuthLayout, { AuthTitle, AuthInput, AuthError } from '../components/AuthLayout'
import { Button } from '../../../components/ui/button'
import { useAuthStore } from '../../../common/stores/useAuthStore'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || loading) return
    setLoading(true)
    setError('')
    const result = await useAuthStore.getState().forgotPassword({ email })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout backTo="/login">
        <div className="mt-14 flex flex-col items-center text-center">
          <MailCheck size={48} strokeWidth={1.5} className="text-brand" />
          <h1 className="mt-4 text-2xl font-extrabold text-ink">請查收信箱</h1>
          <p className="mt-3 text-base font-medium text-ink-3">
            如果 <span className="font-bold text-ink">{email}</span> 有註冊帳號，重設密碼的連結會寄到這個信箱，連結 1 小時內有效。
          </p>
        </div>
        <p className="mt-8 text-center text-base font-medium text-ink-3">
          <Link to="/login" className="font-extrabold text-brand hover:text-brand-hover">
            返回登入
          </Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout backTo="/login">
      <div className="mt-14">
        <AuthTitle>忘記密碼？</AuthTitle>
      </div>
      <p className="mt-4 text-base font-medium text-ink-3">輸入註冊時使用的電子郵件，我們會寄送重設密碼的連結給你。</p>

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

        <AuthError message={error} />

        <Button type="submit" size="lg" className="h-[3.75rem] w-full rounded-2xl text-lg" disabled={!email.trim()} loading={loading}>
          送出重設連結
        </Button>
      </form>

      <p className="mt-8 text-center text-base font-medium text-ink-3">
        想起密碼了？
        <Link to="/login" className="ml-2 font-extrabold text-brand hover:text-brand-hover">
          返回登入
        </Link>
      </p>
    </AuthLayout>
  )
}
