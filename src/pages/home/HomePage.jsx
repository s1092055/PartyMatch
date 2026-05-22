import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { isAuthenticated } from '../../shared/stores/authStore'
import AppNav from '../../shared/components/layout/AppNav'
import MobileSearch from '../../shared/components/layout/MobileSearch'
import ScrollToTop from '../../shared/components/layout/ScrollToTop'
import CreateGroupModal from '../create/CreateGroupModal'
import MessagesModal from '../messages/MessagesModal'
import ServiceLogo from '../../shared/components/ui/ServiceLogo'
import FeatureCards from './components/FeatureCards'
import HowItWorks from './components/HowItWorks'

const FEATURED_SERVICES = [
  'spotify', 'netflix', 'youtube', 'disney',
  'chatgpt', 'google-one', 'hbo', 'apple-music',
]

const STATS = [
  { value: '30+',   label: '支援服務' },
  { value: '26',    label: '個活躍群組' },
  { value: 'NT$30', label: '最低月費起' },
]

const DISCLAIMER_ITEMS = [
  {
    title: '平台性質聲明',
    body: 'PartyMatch 為純粹的群組媒合平台，僅提供尋找共享訂閱夥伴之功能。本平台不介入任何費用代收、帳號管理或訂閱方案購買，亦不作為交易的任何一方。',
  },
  {
    title: '使用條款責任',
    body: '部分服務（包括但不限於 ChatGPT Plus、Claude Pro、Adobe Creative Cloud、Midjourney 等）並無官方授權的帳號共享方案。用戶在加入任何共享群組前，須自行閱讀並確認該服務之使用條款（Terms of Service）。因違反第三方服務條款所導致的帳號暫停、服務中斷或其他損失，本平台概不負責。',
  },
  {
    title: '金流與帳號安全',
    body: 'PartyMatch 不代為收付款項。所有費用分攤均由群組成員自行協議，透過雙方同意的方式完成。本平台強烈建議用戶勿將帳號主密碼分享予他人，並在適當時機更換密碼。任何因用戶自行分享帳號資訊所造成的損失，本平台不承擔責任。',
  },
  {
    title: '資料使用聲明',
    body: '本平台所收集之個人資料（包括姓名、聯絡方式）僅用於媒合功能及通知目的，不會出售或提供予第三方廣告商。詳細資料處理方式請參閱隱私權政策。',
  },
  {
    title: '免責範圍',
    body: 'PartyMatch 對以下情況不承擔任何法律責任：用戶之間的糾紛或詐騙行為；第三方訂閱服務的價格變動或方案調整；因共享帳號導致的服務品質下降；不可抗力因素所造成的服務中斷。',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <AppNav variant="top" />
      <MobileSearch />
      <ScrollToTop />
      <MessagesModal />
      <CreateGroupModal />

      <section className="mx-auto max-w-5xl px-5 pb-16 pt-20 text-center md:pt-28">
        <img src="/src/assets/Logo.svg" alt="PartyMatch" className="mx-auto mb-5 h-16 w-auto" />
        <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl">
          PartyMatch<br />
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-3">
          PartyMatch 是訂閱共享媒合平台
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {loggedIn ? (
            <button
              onClick={() => navigate('/explore')}
              className="flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-hover"
            >
              前往探索
              <ArrowRight size={15} />
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="mx-auto mt-12 grid max-w-sm grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-raised px-2 py-5 md:max-w-md">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5 px-4">
              <span className="text-2xl font-extrabold text-ink">{value}</span>
              <span className="text-xs text-ink-3">{label}</span>
            </div>
          ))}
        </div>
      </section>

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

      <div className="mx-auto max-w-5xl space-y-8 px-5 py-16">
        <FeatureCards />
        <HowItWorks />

        <div id="disclaimer" className="rounded-xl border border-warning/30 bg-warning-subtle p-5 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="shrink-0 text-warning" />
            <h2 className="text-base font-extrabold text-warning-text">免責聲明</h2>
          </div>
          <div className="space-y-4">
            {DISCLAIMER_ITEMS.map(item => (
              <div key={item.title}>
                <p className="mb-1 text-sm font-bold text-warning-text">{item.title}</p>
                <p className="text-xs leading-relaxed text-warning-text">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-2xs text-warning-text">
            最後更新：2026 年 5 月．繼續使用本平台即表示您已閱讀並同意上述聲明。
          </p>
        </div>
      </div>

      <section className="border-t border-line bg-brand py-14 text-center text-white">
        <h2 className="text-2xl font-extrabold">準備好開始省錢了嗎？</h2>
        <p className="mt-2 text-sm text-blue-200">馬上瀏覽 26 個等待你的共享群組</p>
        <button
          onClick={() => navigate(loggedIn ? '/explore' : '/register')}
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-brand shadow transition-opacity hover:opacity-90"
        >
          {loggedIn ? '前往探索群組' : '免費建立帳號'}
          <ArrowRight size={15} />
        </button>
      </section>

      <footer className="border-t border-line py-6 text-center text-xs text-ink-4">
        <p>PartyMatch 為群組媒合平台，不代管費用或帳號。</p>
        <p className="mt-1">© 2026 PartyMatch · MVP 展示版</p>
      </footer>
    </div>
  )
}
