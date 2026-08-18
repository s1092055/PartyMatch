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
import BenefitsList from './components/BenefitsList'
import IdentityJourney from './components/IdentityJourney'
import AudienceGrid from './components/AudienceGrid'
import WhyUs from './components/WhyUs'
import FAQ from './components/FAQ'
import SectionNav from './components/SectionNav'
import RevealSection from '../../components/ui/primitives/RevealSection'
import { ADMIN_HOME_PATH } from '../../app/AdminRoute'
import { ALL_SERVICES } from './data/allServices'
import { useSettledViewportHeightVar } from '../../common/utils/viewport'

// 逐 Section 滿版高度的計算基準，捲動中維持穩定、放開後才更新，見 viewport.js
// useSettledViewportHeightVar 的說明；className 裡對應寫死同一個變數名 --pm-home-vh
const HOME_VH_VAR = '--pm-home-vh'

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
  useSettledViewportHeightVar(HOME_VH_VAR)

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

      {/* 640px～1024px（平板寬度，can-hover:lg: 判斷仍會給觸控平板套用手機版 nav）這個
          Section 系列原本在 sm: 斷點把上下留白調得比手機版跟桌機版都大（sm:pb-32 sm:pt-20，
          208px，比手機版 112px、桌機版 128px 都多），跟 RevealSection 的自動縮放機制正面
          衝突——留白越多，可用高度預算越少，越容易觸發縮小；平板的螢幕高度本來就常常比手機
          矮（尤其橫向），疊加起來讓平板這個級距的內容縮得特別小、比例明顯不對，已拿掉這個
          sm: 留白，讓留白量從手機到桌機單調遞增，不要中間平板這一段反而最大 */}
      <section id="section-hero" className="relative flex min-h-[var(--pm-home-vh,100dvh)] w-full flex-col items-center justify-center overflow-hidden pb-32 pt-28 text-center lg:pb-20 lg:pt-16">
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

      <section id="section-why-us" className="relative flex min-h-[var(--pm-home-vh,100dvh)] w-full flex-col items-center justify-center px-5 pb-20 pt-8 can-hover:lg:pb-16 can-hover:lg:pt-16">
        <RevealSection className="mx-auto w-full max-w-3xl">
          <WhyUs />
        </RevealSection>
      </section>

      <section id="section-audience" className="relative flex min-h-[var(--pm-home-vh,100dvh)] w-full flex-col items-center justify-center px-5 pb-20 pt-8 lg:pb-20 lg:pt-12">
        <RevealSection className="mx-auto w-full max-w-3xl">
          <AudienceGrid />
        </RevealSection>
      </section>

      <section id="section-featured-groups" className="relative flex min-h-[var(--pm-home-vh,100dvh)] w-full flex-col items-center justify-center px-5 pb-20 pt-8 lg:pb-20 lg:pt-12">
        <RevealSection className="mx-auto w-full max-w-3xl">
          <FeaturedGroupsCarousel />
        </RevealSection>
      </section>

      <section id="section-benefits" className="relative flex min-h-[var(--pm-home-vh,100dvh)] w-full flex-col items-center justify-center px-5 pb-20 pt-8 lg:pb-20 lg:pt-12">
        <RevealSection className="mx-auto w-full max-w-3xl">
          <BenefitsList />
        </RevealSection>
      </section>

      {/* 這個 Section 手機版內容量比其他 Section 都多（身份切換＋Tab＋影片＋說明），手機版
          影片區塊是直式 9:16（之後要放的是手機操作畫面錄影），內容偏高交給 RevealSection
          的全域自動縮放機制處理，這裡的版面對齊方式不用另外補；曾經在這裡試過 justify-start
          把內容整塊往上頂，結果內容變高，比原本的置中還醜，已改回跟其他 Section 一致的
          justify-center + 一般留白量 */}
      <section id="section-identity" className="relative flex min-h-[var(--pm-home-vh,100dvh)] w-full flex-col items-center justify-center px-5 pb-20 pt-8 lg:pb-20 lg:pt-12">
        <RevealSection className="mx-auto w-full max-w-3xl">
          <IdentityJourney />
        </RevealSection>
      </section>

      <section id="section-cta" className="relative flex min-h-[var(--pm-home-vh,100dvh)] w-full flex-col items-center justify-center px-5 pb-20 pt-8 lg:pb-20 lg:pt-12">
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

      <section id="section-faq" className="relative flex min-h-[var(--pm-home-vh,100dvh)] w-full flex-col items-center justify-center px-5 py-20 lg:py-12">
        <RevealSection className="mx-auto w-full max-w-3xl">
          <FAQ />
        </RevealSection>
      </section>

      <AppFooter />
    </div>
  )
}
