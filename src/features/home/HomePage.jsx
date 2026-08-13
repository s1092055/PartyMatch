import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Compass } from 'lucide-react'
import { Button } from '../../components/ui/button'
import logoUrl from '../../assets/Logo.svg'
import { useAuthStore } from '../../common/stores/useAuthStore'
import { listServiceTypes } from '../../common/utils/serviceUtils'
import AppNav from '../../common/layout/AppNav'
import ScrollToTop from '../../common/layout/ScrollToTop'
import AppFooter from '../../common/layout/AppFooter'
import FloatingMessages from '../../common/layout/FloatingMessages'
import ServiceLogo from '../../components/ui/ServiceLogo'
import BubbleField from './components/BubbleField'
import ExploreHighlight from './components/ExploreHighlight'
import BenefitsList from './components/BenefitsList'
import AudienceGrid from './components/AudienceGrid'
import WhyUs from './components/WhyUs'
import FAQ from './components/FAQ'
import RevealSection from '../../components/ui/primitives/RevealSection'
import { ADMIN_HOME_PATH } from '../../app/AdminRoute'

const ALL_SERVICES = listServiceTypes()
const MessagesModal = lazy(() => import('../messages/MessagesModal'))
// HomePage 獨立於 AppLayout 之外（AppLayout 平常才會掛一份 GroupDetailModal），
// Hero 區塊直接嵌入真實的 ExploreGroupCard，點擊要能開啟群組詳情，這裡要自己掛一份
const GroupDetailModal = lazy(() => import('../group/GroupDetailModal'))

export default function HomePage() {
  const navigate = useNavigate()
  const loggedIn = useAuthStore(s => s.loggedIn)
  const isAdmin = useAuthStore(s => s.user?.isAdmin ?? false)
  const heroRef = useRef(null)
  const [showScrollCue, setShowScrollCue] = useState(true)

  // Hero 還有大部分在視窗內才顯示「查看更多」，使用者捲到下方內容或直接點擊後就收起來，
  // 不要停留在已經看過的地方
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowScrollCue(entry.isIntersecting),
      { threshold: 0.6 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 管理員帳號不參與一般使用者流程（探索/建立/加入群組），登入後一律停在管理員後台，
  // 這裡額外攔一次是為了「已登入的管理員直接輸入網址回到首頁」的情境，不只靠登入當下的導頁
  if (loggedIn && isAdmin) return <Navigate to={ADMIN_HOME_PATH} replace />

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink can-hover:lg:ml-20 can-hover:lg:mr-24">
      <AppNav />
      <ScrollToTop />
      <Suspense fallback={null}>
        <MessagesModal />
        <GroupDetailModal />
      </Suspense>
      <FloatingMessages />

      <div className="mx-auto w-full min-w-0 max-w-3xl px-5">
        <section ref={heroRef} className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden pb-10 pt-28 text-center lg:pt-16">
          <BubbleField count={9} size={46} />

          <div className="relative">
            <img src={logoUrl} alt="PartyMatch" className="mx-auto mb-5 h-14 w-auto" />
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl">
              Party<span className="text-brand">Match</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-3">
              共享訂閱服務平台
            </p>

            <div className="mt-8 flex items-center justify-center">
              <Button size="lg" className="rounded-card px-8" onClick={() => navigate('/explore')}>
                <Compass size={16} strokeWidth={1.5} />
                探索群組
              </Button>
            </div>
          </div>

          <a
            href="#explore-highlight"
            onClick={() => setShowScrollCue(false)}
            className={`absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-sm font-bold text-ink-2 transition-opacity duration-300 hover:text-brand ${
              showScrollCue ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            查看更多
            <span className="grid h-8 w-8 place-items-center rounded-full border border-line bg-canvas text-ink-3 shadow-md animate-bounce">
              <ChevronDown size={16} strokeWidth={1.5} />
            </span>
          </a>
        </section>

        <div className="space-y-24 pb-24 pt-16">
          <RevealSection><ExploreHighlight /></RevealSection>
          <RevealSection><BenefitsList /></RevealSection>
          <RevealSection><AudienceGrid /></RevealSection>
          <RevealSection><WhyUs /></RevealSection>
        </div>
      </div>

      <RevealSection>
        <section className="mx-auto max-w-3xl px-5 pb-24 text-center">
          <div className="rounded-card border border-line bg-surface px-5 py-10 sm:px-8 sm:py-12">
            <h2 className="text-2xl font-extrabold text-ink md:text-3xl">立即開始你的共享訂閱之旅</h2>
            <p className="mt-3 text-base text-ink-3">加入 PartyMatch，享受更聰明的訂閱生活！</p>

            <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="rounded-full px-8" onClick={() => navigate('/explore')}>
                <Compass size={16} strokeWidth={1.5} />
                探索群組
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full px-8"
                onClick={() => navigate(loggedIn ? '/create-group' : '/register')}
              >
                建立群組
                <ChevronRight size={15} strokeWidth={1.5} />
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              {ALL_SERVICES.slice(0, 5).map(s => (
                <ServiceLogo key={s.id} serviceId={s.id} size={32} />
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      <div className="mx-auto max-w-3xl px-5 pb-16">
        <RevealSection><FAQ /></RevealSection>
      </div>

      <AppFooter />
    </div>
  )
}
