import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AuthLayout({ children }) {
  return (
    <main className="min-h-screen bg-canvas px-4 py-8 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[26rem] flex-col justify-center gap-4">
        <section className="animate-fade-in-up w-full py-4">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm font-bold text-ink-4 transition-colors hover:text-ink-2"
          >
            <ArrowLeft size={14} />
            返回
          </Link>
          {children}
        </section>
        <p className="text-center text-sm font-medium text-ink-3">© 2026 PartyMatch</p>
      </div>
    </main>
  )
}

export function AuthInput({ icon: Icon, label, value, onChange, trailing, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-ink">{label}</span>
      <span className="flex h-[3.75rem] items-center gap-3 rounded-2xl border border-line bg-surface px-4 transition-colors focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-subtle">
        <Icon size={20} className="shrink-0 text-ink-4" />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-full flex-1 bg-transparent text-base font-medium text-ink outline-none placeholder:text-ink-4"
          {...props}
        />
        {trailing}
      </span>
    </label>
  )
}

export function PasswordToggle({ visible, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full text-ink-4 transition-colors hover:bg-raised hover:text-ink-2"
      aria-label={visible ? '隱藏密碼' : '顯示密碼'}
    >
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  )
}

export function AuthDivider() {
  return (
    <div className="my-8 grid grid-cols-[1fr_auto_1fr] items-center gap-5 text-sm font-medium text-ink-4">
      <span className="h-px bg-line" />
      或使用以下方式繼續
      <span className="h-px bg-line" />
    </div>
  )
}

export function GoogleMark() {
  return (
    <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-base font-black shadow-sm">
      <span className="bg-gradient-to-br from-blue-500 via-green-500 to-amber-500 bg-clip-text text-transparent">G</span>
    </span>
  )
}

