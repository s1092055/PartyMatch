import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import AuthLayout, { AuthInput } from '../components/AuthLayout'
import Button from '../../../shared/ui/primitives/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')

  return (
    <AuthLayout backTo="/login">
      <div className="mt-14">
        <h1 className="text-4xl font-extrabold leading-tight text-ink md:text-4xl">忘記密碼？</h1>
        <p className="mt-5 text-base font-medium leading-relaxed text-ink-3">
          輸入你的電子郵件，我們會寄出重設密碼連結。
        </p>
      </div>

      <form className="mt-9 space-y-5" onSubmit={e => e.preventDefault()}>
        <AuthInput
          icon={Mail}
          label="電子郵件"
          type="email"
          placeholder="請輸入電子郵件"
          value={email}
          onChange={setEmail}
        />

        <Button type="submit" size="lg" className="h-[3.75rem] w-full gap-2 text-lg" disabled>
          送出重設連結
          <span className="rounded-full bg-raised px-2 py-0.5 text-2xs font-bold text-ink-3">即將推出</span>
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
