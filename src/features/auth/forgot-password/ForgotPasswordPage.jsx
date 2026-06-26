import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import AuthLayout, { AuthInput } from '../components/AuthLayout'
import Button from '../../../shared/ui/Button'
import { resetPassword } from '../../../shared/stores/authStore'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || loading) return
    setLoading(true)
    await resetPassword(email)
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <AuthLayout>
      <div className="mt-14">
        <h1 className="text-4xl font-extrabold leading-tight text-ink md:text-4xl">忘記密碼？</h1>
        <p className="mt-5 text-base font-medium leading-relaxed text-ink-3">
          輸入你的電子郵件，我們會寄出重設密碼連結。
        </p>
      </div>

      <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
        <AuthInput
          icon={Mail}
          label="電子郵件"
          type="email"
          placeholder="請輸入電子郵件"
          value={email}
          onChange={value => { setEmail(value); setSubmitted(false) }}
        />

        {submitted && (
          <div className="rounded-2xl border border-success/20 bg-success-subtle px-4 py-3 text-sm font-semibold text-success-text">
            如果此信箱已註冊，我們會寄出重設密碼連結。
          </div>
        )}

        <Button type="submit" size="lg" className="h-[3.75rem] w-full text-lg" disabled={!email.trim() || loading}>
          {loading ? '寄送中…' : '送出重設連結'}
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
