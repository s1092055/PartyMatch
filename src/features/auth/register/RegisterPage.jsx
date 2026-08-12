import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail, User } from 'lucide-react'
import AuthLayout, { AuthTitle, AuthInput, AuthError, PasswordToggle, PhoneInput } from '../components/AuthLayout'
import VerifyCodeModal, { VerifyTrailingButton } from '../components/VerifyCodeModal'
import { Button } from '../../../components/ui/button'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { DEFAULT_COUNTRY_CODE, toE164 } from '../../../common/utils/phone'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+[1-9]\d{6,14}$/

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
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
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [verifyingType, setVerifyingType] = useState(null) // 'email' | 'phone' | null

  const validationError = getValidationError(form, accepted, emailVerified, phoneVerified)
  const canSubmit = !validationError && !loading

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setError('')
    // 驗證過的信箱/手機被改動，先前的驗證結果就不算數了，避免使用者驗證完再偷改內容
    if (key === 'email') setEmailVerified(false)
    if (key === 'phoneLocal' || key === 'phoneCountryCode') setPhoneVerified(false)
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
    const { from, reopenGroupModalId } = location.state ?? {}
    if (reopenGroupModalId) {
      navigate(from || '/', { replace: true, state: { reopenGroupModalId } })
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <AuthLayout backTo="/login">
      <div className="mt-10">
        <AuthTitle>註冊 PartyMatch</AuthTitle>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          icon={User}
          label="顯示名稱"
          autoComplete="name"
          placeholder="請輸入顯示名稱"
          value={form.name}
          onChange={value => updateField('name', value)}
          hint="1～50 字"
        />
        <AuthInput
          icon={Mail}
          label="電子郵件"
          type="email"
          autoComplete="email"
          placeholder="請輸入電子郵件"
          value={form.email}
          onChange={value => updateField('email', value)}
          hint="需符合信箱格式，例如 name@example.com"
          trailing={(
            <VerifyTrailingButton
              verified={emailVerified}
              disabled={!EMAIL_REGEX.test(form.email.trim())}
              onClick={() => setVerifyingType('email')}
            />
          )}
        />
        <PhoneInput
          label="手機號碼"
          countryCode={form.phoneCountryCode}
          onCountryCodeChange={value => updateField('phoneCountryCode', value)}
          value={form.phoneLocal}
          onChange={value => updateField('phoneLocal', value)}
          hint="不含國碼、開頭 0，例如 912345678"
          trailing={(
            <VerifyTrailingButton
              verified={phoneVerified}
              disabled={!PHONE_REGEX.test(toE164(form.phoneCountryCode, form.phoneLocal))}
              onClick={() => setVerifyingType('phone')}
            />
          )}
        />
        <AuthInput
          icon={Lock}
          label="密碼"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="請輸入密碼"
          value={form.password}
          onChange={value => updateField('password', value)}
          hint="至少 6 碼"
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
          hint="需與上方密碼一致"
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

      <p className="mt-8 text-center text-base font-medium text-ink-3">
        已經有帳號？
        <Link to="/login" state={location.state} className="ml-2 font-extrabold text-brand hover:text-brand-hover">
          立即登入
        </Link>
      </p>

      <VerifyCodeModal
        open={!!verifyingType}
        onOpenChange={v => { if (!v) setVerifyingType(null) }}
        type={verifyingType}
        target={verifyingType === 'email' ? form.email : verifyingType === 'phone' ? toE164(form.phoneCountryCode, form.phoneLocal) : ''}
        onVerified={() => {
          if (verifyingType === 'email') setEmailVerified(true)
          if (verifyingType === 'phone') setPhoneVerified(true)
        }}
      />
    </AuthLayout>
  )
}

function getValidationError(form, accepted, emailVerified, phoneVerified) {
  if (!form.name.trim()) return '請輸入顯示名稱'
  if (!form.email.trim()) return '請輸入電子郵件'
  if (!EMAIL_REGEX.test(form.email.trim())) return '請輸入正確的電子郵件格式'
  if (!form.phoneLocal.trim()) return '請輸入手機號碼'
  if (!PHONE_REGEX.test(toE164(form.phoneCountryCode, form.phoneLocal))) return '請輸入正確的手機號碼格式'
  if (!emailVerified) return '請先完成信箱驗證'
  if (!phoneVerified) return '請先完成手機號碼驗證'
  if (form.password.length < 6) return '密碼至少需要 6 碼'
  if (form.confirmPassword !== form.password) return '確認密碼必須和密碼一致'
  if (!accepted) return '請先同意服務條款與隱私政策'
  return ''
}
