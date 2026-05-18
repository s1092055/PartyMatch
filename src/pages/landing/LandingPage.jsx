import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Users, Zap, TrendingDown, ArrowRight } from 'lucide-react'
import { isAuthenticated } from '../../shared/stores/authStore'
import ServiceLogo from '../../shared/components/ui/ServiceLogo'

const FEATURED_SERVICES = [
  'spotify', 'netflix', 'youtube', 'disney',
  'chatgpt', 'google-one', 'hbo', 'apple-music',
]

const HOW_IT_WORKS = [
  {
    icon: Users,
    title: '探索群組',
    desc: '瀏覽 30+ 種服務的共享群組，依分類或價格自由篩選',
  },
  {
    icon: Zap,
    title: '申請或立即加入',
    desc: '找到適合的群組後，一鍵申請或選擇立即加入方案',
  },
  {
    icon: TrendingDown,
    title: '分攤費用・輕鬆享用',
    desc: '每月只需支付個人方案的幾分之一，享受完整服務品質',
  },
]

const STATS = [
  { value: '30+', label: '支援服務' },
  { value: '26',  label: '個活躍群組' },
  { value: 'NT$30', label: '最低月費起' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated()) navigate('/explore', { replace: true })
  }, [navigate])

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-line bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <span className="text-xl font-extrabold tracking-tight text-brand">PartyMatch</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-ink-2 transition-colors hover:bg-raised hover:text-ink"
            >
              登入
            </button>
            <button
              onClick={() => navigate('/register')}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
            >
              免費加入
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pb-16 pt-20 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-subtle px-3 py-1 text-xs font-bold text-brand">
          <ShieldCheck size={12} />
          安全媒合・無帳號代管
        </span>
        <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
          每月省更多<br />
          <span className="text-brand">找到可信賴的共享夥伴</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-3">
          PartyMatch 是訂閱共享媒合平台，幫助你找到志同道合的人一起分攤
          Spotify、Netflix、ChatGPT 等熱門服務費用。
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate('/register')}
            className="flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-hover"
          >
            立即免費加入
            <ArrowRight size={15} />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="rounded-xl border border-line px-6 py-3 text-sm font-semibold text-ink-2 transition-colors hover:bg-raised hover:text-ink"
          >
            已有帳號・登入
          </button>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-12 grid max-w-sm grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-raised px-2 py-5 sm:max-w-md">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5 px-4">
              <span className="text-2xl font-extrabold text-ink">{value}</span>
              <span className="text-xs text-ink-3">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured services */}
      <section className="border-y border-line bg-raised py-12">
        <div className="mx-auto max-w-5xl px-5">
          <p className="mb-7 text-center text-xs font-bold uppercase tracking-widest text-ink-4">
            支援熱門訂閱服務
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {FEATURED_SERVICES.map(id => (
              <ServiceLogo key={id} serviceId={id} size={52} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center text-2xl font-extrabold text-ink">三步驟開始省錢</h2>
        <p className="mt-2 text-center text-sm text-ink-3">最快 5 分鐘完成配對，最快當天開始享用服務</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-white p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-subtle">
                <Icon size={22} className="text-brand" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-4">Step {i + 1}</p>
                <h3 className="mt-1 text-base font-extrabold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-3">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="border-t border-line bg-brand py-14 text-center text-white">
        <h2 className="text-2xl font-extrabold">準備好開始省錢了嗎？</h2>
        <p className="mt-2 text-sm text-blue-200">免費加入，馬上瀏覽 26 個等待你的共享群組</p>
        <button
          onClick={() => navigate('/register')}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-brand shadow transition-opacity hover:opacity-90"
        >
          免費建立帳號
          <ArrowRight size={15} />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-6 text-center text-xs text-ink-4">
        <p>PartyMatch 為群組媒合平台，不代管費用或帳號。</p>
        <p className="mt-1">© 2026 PartyMatch · MVP 展示版</p>
      </footer>
    </div>
  )
}
