import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import AuthLayout, { AuthInput } from '../../../shared/components/auth/AuthLayout'
import Button from '../../../shared/components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
  }

  return (
    <AuthLayout illustrationTitle="更聰明的訂閱方式">
      <div className="mt-14">
        <h1 className="text-4xl font-extrabold leading-tight text-ink sm:text-[3rem]">忘記密碼？</h1>
        <p className="mt-5 text-base font-medium leading-relaxed text-ink-3">
          輸入你的電子郵件，我們會提供重設密碼的方式。
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
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">
            如果此信箱已註冊，我們會寄出重設密碼連結。
          </div>
        )}

        <Button type="submit" size="lg" className="h-[3.75rem] w-full text-lg" disabled={!email.trim()}>
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
