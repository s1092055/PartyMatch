import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Compass, Search } from 'lucide-react'
import { Button } from '../../components/ui/button'
import logoUrl from '../../assets/Logo.svg'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import { listServiceTypes } from '../../shared/utils/serviceUtils'
import AppNav from '../../shared/layout/AppNav'
import ScrollToTop from '../../shared/layout/ScrollToTop'
import AppFooter from '../../shared/layout/AppFooter'
import FloatingMessages from '../../shared/layout/FloatingMessages'
import ServiceLogo from '../../shared/ui/ServiceLogo'
import FeatureCards from './components/FeatureCards'
import ExtraFeatures from './components/ExtraFeatures'
import HowItWorks from './components/HowItWorks'
import FAQ from './components/FAQ'
import RevealSection from '../../shared/ui/primitives/RevealSection'

const ALL_SERVICES = listServiceTypes()
const MessagesModal = lazy(() => import('../messages/MessagesModal'))

export default function HomePage() {
  const navigate = useNavigate()
  const loggedIn = useAuthStore(s => s.loggedIn)

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink lg:ml-24">
      <AppNav />
      <ScrollToTop />
      <Suspense fallback={null}>
        <MessagesModal />
      </Suspense>
      <FloatingMessages />

      <section className="mx-auto max-w-5xl px-5 pb-16 pt-28 text-center lg:pt-16">
        <img src={logoUrl} alt="PartyMatch" className="mx-auto mb-5 h-16 w-auto" />
        <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl">
          PartyMatch<br />
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-3">
          共享訂閱媒合平台，整合尋找夥伴、送出申請、款項代管與即時溝通，讓您於單一平台完成所有流程。
        </p>
        <div className="mx-auto mt-12 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="px-8" onClick={() => navigate('/explore')}>
            <Compass size={16} />
            探索群組
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate('/quick-match')}
          >
            <Search size={16} />
            快速搜尋
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
                <div key={`${s.id}-${i >= ALL_SERVICES.length ? 'b' : 'a'}`} className="shrink-0">
                  <ServiceLogo serviceId={s.id} size={52} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      <div className="mx-auto max-w-5xl px-5 pt-16">
        <FeatureCards />
      </div>

      <div className="py-24">
        <RevealSection><ExtraFeatures /></RevealSection>
      </div>

      <div className="mx-auto max-w-5xl flex-1 space-y-24 px-5 pb-16">
        <RevealSection><HowItWorks /></RevealSection>
        <RevealSection><FAQ /></RevealSection>
      </div>

      <RevealSection>
        <section className="py-14 text-center text-ink">
          <h2 className="text-2xl font-extrabold">即刻開始使用</h2>
          <Button
            size="lg"
            onClick={() => navigate(loggedIn ? '/explore' : '/register')}
            className="mt-7 rounded-xl shadow"
          >
            {loggedIn ? '前往探索群組' : '免費建立帳號'}
            <ChevronRight size={15} strokeWidth={1.5} />
          </Button>
        </section>
      </RevealSection>

      <AppFooter />
    </div>
  )
}
