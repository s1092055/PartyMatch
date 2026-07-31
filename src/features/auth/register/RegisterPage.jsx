import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, User } from 'lucide-react'
import AuthLayout, { AuthInput, AuthDivider, AuthError, GoogleMark, PasswordToggle, PhoneInput } from '../components/AuthLayout'
import { Button } from '../../../components/ui/button'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { DEFAULT_COUNTRY_CODE, toE164 } from '../../../common/utils/phone'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneCountryCode: DEFAULT_COUNTRY_CODE,
    phoneLocal: '',
    password: '',
    confirmPassword: '',
  })
  const [accepted, setAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validationError = getValidationError(form, accepted)
  const canSubmit = !validationError && !loading

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) {
      setError(validationError)
      return
    }
    setLoading(true)
    setError('')
    const { phoneCountryCode, phoneLocal, ...rest } = form
    const result = await useAuthStore.getState().register({ ...rest, phone: toE164(phoneCountryCode, phoneLocal) })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <AuthLayout backTo="/login">
      <div className="mt-10">
        <h1 className="text-4xl font-extrabold leading-tight text-ink md:text-4xl">註冊 PartyMatch</h1>
        <p className="mt-5 text-base font-medium leading-relaxed text-ink-3">
          建立帳號後即可開始探索共享訂閱群組、快速搜尋並管理你的訂閱。
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          icon={User}
          label="顯示名稱"
          autoComplete="name"
          placeholder="請輸入顯示名稱"
          value={form.name}
          onChange={value => updateField('name', value)}
        />
        <AuthInput
          icon={Mail}
          label="電子郵件"
          type="email"
          autoComplete="email"
          placeholder="請輸入電子郵件"
          value={form.email}
          onChange={value => updateField('email', value)}
        />
        <PhoneInput
          label="手機號碼"
          countryCode={form.phoneCountryCode}
          onCountryCodeChange={value => updateField('phoneCountryCode', value)}
          value={form.phoneLocal}
          onChange={value => updateField('phoneLocal', value)}
        />
        <AuthInput
          icon={Lock}
          label="密碼"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="請輸入密碼"
          value={form.password}
          onChange={value => updateField('password', value)}
          trailing={<PasswordToggle visible={showPassword} onClick={() => setShowPassword(v => !v)} />}
        />
        <AuthInput
          icon={Lock}
          label="確認密碼"
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="請再次輸入密碼"
          value={form.confirmPassword}
          onChange={value => updateField('confirmPassword', value)}
          trailing={<PasswordToggle visible={showConfirmPassword} onClick={() => setShowConfirmPassword(v => !v)} />}
        />

        <label className="flex items-start gap-3 text-sm font-medium text-ink-2">
          <input
            type="checkbox"
            checked={accepted}
            onChange={e => {
              setAccepted(e.target.checked)
              setError('')
            }}
            className="mt-0.5 h-5 w-5 rounded accent-brand"
          />
          <span>
            我已閱讀並同意{' '}
            <Link to="/terms" target="_blank" className="font-bold text-brand hover:text-brand-hover">服務條款</Link>
            {' '}與{' '}
            <Link to="/privacy" target="_blank" className="font-bold text-brand hover:text-brand-hover">隱私政策</Link>
          </span>
        </label>

        <AuthError message={error} />

        <Button type="submit" size="lg" className="h-[3.75rem] w-full text-lg" disabled={!!validationError} loading={loading}>
          註冊
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
        已經有帳號？
        <Link to="/login" className="ml-2 font-extrabold text-brand hover:text-brand-hover">
          立即登入
        </Link>
      </p>
    </AuthLayout>
  )
}

function getValidationError(form, accepted) {
  if (!form.name.trim()) return '請輸入顯示名稱'
  if (!form.email.trim()) return '請輸入電子郵件'
  if (!form.phoneLocal.trim()) return '請輸入手機號碼'
  if (!/^\+[1-9]\d{6,14}$/.test(toE164(form.phoneCountryCode, form.phoneLocal))) return '請輸入正確的手機號碼格式'
  if (form.password.length < 6) return '密碼至少需要 6 碼'
  if (form.confirmPassword !== form.password) return '確認密碼必須和密碼一致'
  if (!accepted) return '請先同意服務條款與隱私政策'
  return ''
}
