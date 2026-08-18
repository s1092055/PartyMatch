import { lazy, Suspense, useLayoutEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ChevronRight, Compass } from 'lucide-react'
import { Button } from '../../components/ui/button'
import logoUrl from '../../assets/Logo.svg'
import { useAuthStore } from '../../common/stores/useAuthStore'
import AppNav from '../../common/layout/AppNav'
import AppFooter from '../../common/layout/AppFooter'
import FloatingMessages from '../../common/layout/FloatingMessages'
import ServiceLogo from '../../components/ui/ServiceLogo'
import BubbleField from './components/BubbleField'
import ScrollCue from './components/ScrollCue'
import FeaturedGroupsCarousel from './components/FeaturedGroupsCarousel'
import IdentityJourney from './components/IdentityJourney'
import AudienceGrid from './components/AudienceGrid'
import WhyUs from './components/WhyUs'
import FAQ from './components/FAQ'
import SectionNav from './components/SectionNav'
import RevealSection from '../../components/ui/primitives/RevealSection'
import { ADMIN_HOME_PATH } from '../../app/AdminRoute'
import { ALL_SERVICES } from './data/allServices'

const MessagesModal = lazy(() => import('../messages/MessagesModal'))
// HomePage 獨立於 AppLayout 之外（AppLayout 平常才會掛一份 GroupDetailModal／QuickMatchModal），
// Hero 區塊直接嵌入真實的 ExploreGroupCard，點擊要能開啟群組詳情，快速搜尋按鈕也要能開啟
// 快速搜尋 Modal，這裡都要自己掛一份
const GroupDetailModal = lazy(() => import('../group/GroupDetailModal'))
const QuickMatchModal = lazy(() => import('../match/QuickMatchModal'))

export default function HomePage() {
  const navigate = useNavigate()
  const loggedIn = useAuthStore(s => s.loggedIn)
  const isAdmin = useAuthStore(s => s.user?.isAdmin ?? false)

  // 從別的頁面導回首頁時（例如點導覽列 logo），SPA 的 client-side 導頁不會像整頁重新載入
  // 那樣自動把捲動位置歸零，會直接沿用上一頁當下的 scrollY，導致回首頁時卡在某個 Section
  // 中間而不是 Hero。用 useLayoutEffect（在瀏覽器畫出這一幀之前跑）而不是 useEffect，
  // 避免使用者先看到錯誤位置的畫面閃一下才跳回頂部
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // 管理員帳號不參與一般使用者流程（探索/建立/加入群組），登入後一律停在管理員後台，
  // 這裡額外攔一次是為了「已登入的管理員直接輸入網址回到首頁」的情境，不只靠登入當下的導頁
  if (loggedIn && isAdmin) return <Navigate to={ADMIN_HOME_PATH} replace />

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink can-hover:lg:ml-20 can-hover:lg:mr-24">
      <AppNav />
      <Suspense fallback={null}>
        <MessagesModal />
        <GroupDetailModal />
        <QuickMatchModal />
      </Suspense>
      <FloatingMessages />
      <SectionNav />
      <ScrollCue />

      <section id="section-hero" className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden pb-32 pt-28 text-center lg:pb-20 lg:pt-16">
        <BubbleField count={9} size={46} />

        <RevealSection className="relative mx-auto w-full max-w-3xl px-5">
          <img src={logoUrl} alt="PartyMatch" className="mx-auto mb-5 h-14 w-auto" />
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl">
            Party<span className="text-brand">Match</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-3">
            共享訂閱服務平台
          </p>

          <div className="mt-8 flex items-center justify-center">
            <Button size="lg" className="rounded-full px-8" onClick={() => navigate('/explore')}>
              <Compass size={16} strokeWidth={1.5} />
              探索群組
            </Button>
          </div>
        </RevealSection>
      </section>

      <section id="section-why-us" className="relative flex w-full flex-col items-center px-5 py-14 can-hover:lg:py-20">
        <RevealSection className="mx-auto w-full max-w-3xl">
          <WhyUs />
        </RevealSection>
      </section>

      <section id="section-audience" className="relative flex w-full flex-col items-center px-5 py-14 can-hover:lg:py-20">
        <RevealSection className="mx-auto w-full max-w-3xl">
          <AudienceGrid />
        </RevealSection>
      </section>

      <section id="section-featured-groups" className="relative flex w-full flex-col items-center px-5 py-14 can-hover:lg:py-20">
        <RevealSection className="mx-auto w-full max-w-3xl">
          <FeaturedGroupsCarousel />
        </RevealSection>
      </section>

      <section id="section-identity" className="relative flex w-full flex-col items-center px-5 py-14 can-hover:lg:py-20">
        <RevealSection className="mx-auto w-full max-w-3xl">
          <IdentityJourney />
        </RevealSection>
      </section>

      <section id="section-cta" className="relative flex w-full flex-col items-center px-5 py-14 can-hover:lg:py-20">
        <RevealSection className="mx-auto w-full max-w-3xl text-center">
          <div className="rounded-card border border-line bg-surface px-5 py-10 sm:px-8 sm:py-12">
            <h2 className="text-2xl font-extrabold text-ink md:text-3xl">立即開始共享訂閱之旅</h2>
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
        </RevealSection>
      </section>

      <section id="section-faq" className="relative flex w-full flex-col items-center px-5 py-14 can-hover:lg:py-20">
        <RevealSection className="mx-auto w-full max-w-3xl">
          <FAQ />
        </RevealSection>
      </section>

      <AppFooter />
    </div>
  )
}
