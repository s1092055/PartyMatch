import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import logoUrl from '../../assets/Logo.svg'
import { isAuthenticated } from '../../shared/stores/authStore'
import { getGroups } from '../../shared/stores/groupStore'
import AppNav from '../../shared/components/layout/AppNav'
import MobileSearch from '../../shared/components/layout/MobileSearch'
import ScrollToTop from '../../shared/components/layout/ScrollToTop'
import AppFooter from '../../shared/components/layout/AppFooter'
import CreateGroupModal from '../create/CreateGroupModal'
import MessagesModal from '../messages/MessagesModal'
import QuickMatchModal from '../match/QuickMatchModal'
import FloatingMessages from '../../shared/components/layout/FloatingMessages'
import ServiceLogo from '../../shared/components/ui/ServiceLogo'
import FeatureCards from './components/FeatureCards'
import HowItWorks from './components/HowItWorks'
import FAQ from './components/FAQ'
import RevealSection from '../../shared/components/ui/RevealSection'

const FEATURED_SERVICES = [
  'spotify', 'netflix', 'youtube', 'disney',
  'chatgpt', 'google-one', 'hbo', 'apple-music',
]

export default function HomePage() {
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()
  const activeGroupCount = getGroups().filter(g => g.status === 'recruiting' && g.openSeats > 0).length

  const STATS = [
    { value: '30+',   label: '支援服務' },
    { value: String(activeGroupCount), label: '個活躍群組' },
    { value: 'NT$30', label: '最低月費起' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink md:ml-24">
      <AppNav />
      <MobileSearch />
      <ScrollToTop />
      <MessagesModal />
      <CreateGroupModal />
      <QuickMatchModal />
      <FloatingMessages />

      <section className="mx-auto max-w-5xl px-5 pb-16 pt-20 text-center md:pt-16">
        <img src={logoUrl} alt="PartyMatch" className="mx-auto mb-5 h-16 w-auto" />
        <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl">
          PartyMatch<br />
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-3">
          PartyMatch 是訂閱共享媒合平台
        </p>
        <div className="mx-auto mt-12 grid max-w-sm grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-raised px-2 py-5 md:max-w-md">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5 px-4">
              <span className="text-2xl font-extrabold text-ink">{value}</span>
              <span className="text-xs text-ink-3">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <RevealSection>
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
      </RevealSection>

      <div className="mx-auto max-w-5xl flex-1 space-y-16 px-5 py-16">
        <FeatureCards />
        <RevealSection><HowItWorks /></RevealSection>
        <RevealSection><FAQ /></RevealSection>
      </div>

      <RevealSection>
        <section className="border-t border-line bg-brand py-14 text-center text-white">
          <h2 className="text-2xl font-extrabold">準備好了嗎？</h2>
          <p className="mt-2 text-sm text-blue-200">馬上瀏覽 {activeGroupCount} 個等待你的共享群組</p>
          <button
            onClick={() => navigate(loggedIn ? '/explore' : '/register')}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-brand shadow transition-opacity hover:opacity-90"
          >
            {loggedIn ? '前往探索群組' : '免費建立帳號'}
            <ArrowRight size={15} />
          </button>
        </section>
      </RevealSection>

      <AppFooter />
    </div>
  )
}
