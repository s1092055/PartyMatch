import { Eye, EyeOff, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import logoUrl from '../../../assets/Logo.svg'
import { Button } from '../../../components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select'
import { COUNTRY_CODES } from '../../../common/utils/phone'

export default function AuthLayout({ children, backTo = '/' }) {
  return (
    <main className="min-h-screen bg-canvas px-4 py-8 text-ink">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[26rem] flex-col justify-between gap-4">
        <section className="animate-fade-in-up w-full py-4">
          <Link
            to={backTo}
            aria-label="返回"
            className="inline-flex text-ink-4 transition-colors hover:text-ink-2"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </Link>
          {children}
        </section>
        <p className="text-center text-sm font-medium text-ink-3">© 2026 PartyMatch</p>
      </div>
    </main>
  )
}

export function AuthTitle({ children }) {
  return (
    <div className="flex items-center gap-3">
      <img src={logoUrl} alt="" className="h-12 w-12 shrink-0 sm:h-16 sm:w-16" />
      <h1 className="whitespace-nowrap text-2xl font-extrabold leading-tight text-ink sm:text-3xl">{children}</h1>
    </div>
  )
}

export function AuthInput({ icon: Icon, label, value, onChange, trailing, hint, error, onBlur, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-ink">{label}</span>
      <span className={`flex h-[3.75rem] items-center gap-3 rounded-2xl border bg-surface px-4 transition-[box-shadow] ${error ? 'border-danger-subtle focus-within:ring-4 focus-within:ring-danger-subtle' : 'border-line focus-within:ring-4 focus-within:ring-brand-subtle'}`}>
        <Icon size={20} strokeWidth={1.5} className="shrink-0 text-ink-4" />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error}
          className="h-full flex-1 bg-transparent text-base font-medium text-ink outline-none placeholder:text-ink-4"
          {...props}
        />
        {trailing}
      </span>
      {error ? (
        <span role="alert" className="mt-1.5 block pl-4 text-xs font-semibold text-danger-text">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block pl-4 text-xs font-medium text-ink-4">{hint}</span>
      ) : null}
    </label>
  )
}

export function PhoneInput({ label, countryCode, onCountryCodeChange, value, onChange, trailing, hint, error, onBlur }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-ink">{label}</span>
      <span className={`flex h-[3.75rem] items-center gap-2 rounded-2xl border bg-surface pl-2 pr-4 transition-[box-shadow] ${error ? 'border-danger-subtle focus-within:ring-4 focus-within:ring-danger-subtle' : 'border-line focus-within:ring-4 focus-within:ring-brand-subtle'}`}>
        <Select value={countryCode} onValueChange={onCountryCodeChange}>
          <SelectTrigger aria-label="國碼" className="h-full w-auto shrink-0 gap-1 border-0 bg-transparent px-2 text-base font-bold focus:border-0 focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_CODES.map(c => (
              <SelectItem key={c.code} value={c.code}>{c.code} {c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="h-6 w-px shrink-0 bg-line" />
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="請輸入手機號碼"
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={onBlur}
          aria-invalid={!!error}
          className="h-full flex-1 bg-transparent text-base font-medium text-ink outline-none placeholder:text-ink-4"
        />
        {trailing}
      </span>
      {error ? (
        <span role="alert" className="mt-1.5 block pl-4 text-xs font-semibold text-danger-text">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block pl-4 text-xs font-medium text-ink-4">{hint}</span>
      ) : null}
    </label>
  )
}

export function PasswordToggle({ visible, onClick }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="ghost"
      size="icon"
      className="text-ink-4 hover:text-ink-2"
      aria-label={visible ? '隱藏密碼' : '顯示密碼'}
    >
      {visible ? <EyeOff strokeWidth={1.5} size={18} /> : <Eye strokeWidth={1.5} size={18} />}
    </Button>
  )
}

export function AuthError({ message }) {
  if (!message) return null
  return (
    <div role="alert" className="rounded-inner border border-danger-subtle bg-danger-subtle px-4 py-3 text-sm font-semibold text-danger-text">
      {message}
    </div>
  )
}

