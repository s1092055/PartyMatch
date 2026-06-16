import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Compass, Zap } from 'lucide-react'
import Button from '../../shared/ui/Button'
import logoUrl from '../../assets/Logo.svg'
import { isAuthenticated } from '../../shared/stores/authStore'
import { getGroups } from '../../shared/stores/groupStore'
import { listServiceTypes } from '../../shared/utils/serviceUtils'
import AppNav from '../../shared/layout/AppNav'
import MobileSearch from '../../shared/layout/MobileSearch'
import ScrollToTop from '../../shared/layout/ScrollToTop'
import AppFooter from '../../shared/layout/AppFooter'
import FloatingMessages from '../../shared/layout/FloatingMessages'
import ServiceLogo from '../../shared/ui/ServiceLogo'
import FeatureCards from './components/FeatureCards'
import ExtraFeatures from './components/ExtraFeatures'
import HowItWorks from './components/HowItWorks'
import HostGuide from './components/HostGuide'
import FAQ from './components/FAQ'
import RevealSection from '../../shared/ui/RevealSection'

const ALL_SERVICES = listServiceTypes()
const CreateGroupModal = lazy(() => import('../create/CreateGroupModal'))
const MessagesModal = lazy(() => import('../messages/MessagesModal'))
const QuickMatchModal = lazy(() => import('../match/QuickMatchModal'))

export default function HomePage() {
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()
  const activeGroupCount = getGroups().filter(g => g.status === 'recruiting' && g.openSeats > 0).length

  const STATS = [
    { value: '30+',                    label: '支援服務' },
    { value: String(activeGroupCount), label: '個活躍群組' },
    { value: 'NT$30',                  label: '最低月費起' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink md:ml-24">
      <AppNav />
      <MobileSearch />
      <ScrollToTop />
      <Suspense fallback={null}>
        <MessagesModal />
        <CreateGroupModal />
        <QuickMatchModal />
      </Suspense>
      <FloatingMessages />

      <section className="mx-auto max-w-5xl px-5 pb-16 pt-20 text-center md:pt-16">
        <img src={logoUrl} alt="PartyMatch" className="mx-auto mb-5 h-16 w-auto" />
        <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl">
          PartyMatch<br />
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-3">
          PartyMatch 是訂閱共享媒合平台
        </p>
        <div className="mx-auto mt-12 flex items-center justify-center gap-8 md:gap-14">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-extrabold text-ink md:text-3xl">{value}</span>
              <span className="text-xs text-ink-3">{label}</span>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="px-8" onClick={() => navigate('/explore')}>
            <Compass size={16} />
            探索群組
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => window.dispatchEvent(new CustomEvent('pm:open-match'))}
          >
            <Zap size={16} />
            快速配對
          </Button>
        </div>
      </section>

      <RevealSection>
        <section className="py-10 overflow-hidden">
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-ink-4">
            支援熱門訂閱服務
          </p>
          <div className="relative overflow-hidden">
            <div
              className="flex gap-6"
              style={{ animation: 'marquee 30s linear infinite', width: 'max-content' }}
            >
              {[...ALL_SERVICES, ...ALL_SERVICES].map((s, i) => (
                <div key={i} className="shrink-0">
                  <ServiceLogo serviceId={s.id} size={52} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      <div className="mx-auto max-w-5xl flex-1 space-y-24 px-5 py-16">
        <FeatureCards />
        <RevealSection><ExtraFeatures /></RevealSection>
        <RevealSection><HowItWorks /></RevealSection>
        <RevealSection><HostGuide /></RevealSection>
        <RevealSection><FAQ /></RevealSection>
      </div>

      <RevealSection>
        <section className="border-t border-line bg-brand py-14 text-center text-white">
          <h2 className="text-2xl font-extrabold">準備好了嗎？</h2>
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
