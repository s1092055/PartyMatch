import { lazy, Suspense, useEffect, useLayoutEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ChevronRight, Compass } from 'lucide-react'
import { Button } from '../../components/ui/button'
import logoUrl from '../../assets/Logo.svg'
import { useAuthStore } from '../../common/stores/useAuthStore'
import AppNav from '../../common/layout/AppNav'
import ScrollToTop from '../../common/layout/ScrollToTop'
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
import { RevealSectionScaleProvider } from '../../components/ui/primitives/RevealSectionScaleContext'
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

  // 每個 Section 都做成整頁吸附（像 Hero 一樣固定高度、滑一下跳到下一段）：只在首頁掛載期間
  // 幫 <html> 開 scroll-snap，卸載時要記得關掉，不然會影響其他頁面的一般捲動行為。
  // 這裡曾經試過自己寫 JS 攔截 wheel/touch 判斷滑動方向、力道，整套接管切換邏輯，想做到
  // 「不管力道大小都固定切一個 Section」，結果一路衍生出好幾個新問題（桌機滾輪完全不吸附、
  // 動畫中途跳動、切換卡頓、跟原生 scroll-snap 互搶 scrollY），越修越糟。改回單純交給瀏覽器
  // 原生 CSS scroll-snap 處理，不要自己猜/攔截使用者的滑動意圖
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('snap-y', 'snap-mandatory')
    return () => root.classList.remove('snap-y', 'snap-mandatory')
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
        <QuickMatchModal />
      </Suspense>
      <FloatingMessages />
      <SectionNav />

      {/* 所有 min-h-dvh Section 包在同一個 RevealSectionScaleProvider 底下，讓每個
          RevealSection 共用同一個全域縮放比例，不會有的 Section 縮小、有的沒縮到，
          切換 Section 時文字忽大忽小 */}
      <RevealSectionScaleProvider>
        <section id="section-hero" className="relative flex min-h-dvh w-full snap-start flex-col items-center justify-center overflow-hidden pb-32 pt-28 text-center lg:pb-20 lg:pt-16">
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

          <ScrollCue />
        </section>

        <section id="section-why-us" className="relative flex min-h-dvh w-full snap-start flex-col items-center justify-center px-5 pb-32 pt-20 can-hover:lg:pb-16 can-hover:lg:pt-16">
          <RevealSection className="mx-auto w-full max-w-3xl">
            <WhyUs />
          </RevealSection>
          <ScrollCue />
        </section>

        <section id="section-audience" className="relative flex min-h-dvh w-full snap-start flex-col items-center justify-center px-5 pb-32 pt-24 sm:pb-32 sm:pt-20 lg:pb-20 lg:pt-12">
          <RevealSection className="mx-auto w-full max-w-3xl">
            <AudienceGrid />
          </RevealSection>
          <ScrollCue />
        </section>

        <section id="section-featured-groups" className="relative flex min-h-dvh w-full snap-start flex-col items-center justify-center px-5 pb-20 pt-8 sm:pb-32 sm:pt-20 lg:pb-20 lg:pt-12">
          <RevealSection className="mx-auto w-full max-w-3xl">
            <FeaturedGroupsCarousel />
          </RevealSection>
          <ScrollCue />
        </section>

        <section id="section-benefits" className="relative flex min-h-dvh w-full snap-start flex-col items-center justify-center px-5 pb-32 pt-20 lg:pb-20 lg:pt-12">
          <RevealSection className="mx-auto w-full max-w-3xl">
            <BenefitsList />
          </RevealSection>
          <ScrollCue />
        </section>

        {/* 這個 Section 手機版內容量比其他 Section 都多（身份切換＋Tab＋影片＋說明），內容高度
            主要靠 IdentityJourney.jsx 內部把影片區塊改成較矮的 16:9（原本手機版是更高的
            4:5）來減少，不是靠這裡的版面對齊方式解決——ScrollCue 是絕對定位、固定貼在
            Section 底部一段距離，跟內容本身怎麼排列無關；曾經在這裡試過 justify-start
            把內容整塊往上頂，結果內容變高、ScrollCue 沒有跟著往上移，兩者之間反而多出一大塊
            空白，比原本的置中還醜，已改回跟其他 Section 一致的 justify-center + 一般留白量 */}
        <section id="section-identity" className="relative flex min-h-dvh w-full snap-start flex-col items-center justify-center px-5 pb-20 pt-8 sm:pb-32 sm:pt-20 lg:pb-20 lg:pt-12">
          <RevealSection className="mx-auto w-full max-w-3xl">
            <IdentityJourney />
          </RevealSection>
          <ScrollCue />
        </section>

        <section id="section-cta" className="relative flex min-h-dvh w-full snap-start flex-col items-center justify-center px-5 pb-32 pt-20 lg:pb-20 lg:pt-12">
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
          <ScrollCue />
        </section>

        {/* 常見問題是最後一個 Section，底下只剩 Footer，不需要再顯示「下滑查看更多」 */}
        <section id="section-faq" className="relative flex min-h-dvh w-full snap-start flex-col items-center justify-center px-5 py-20 lg:py-12">
          <RevealSection className="mx-auto w-full max-w-3xl">
            <FAQ />
          </RevealSection>
        </section>
      </RevealSectionScaleProvider>

      {/* Footer 本身沒有 min-h-dvh，若不給 snap 對齊點，捲動慣性只滑過 Footer 一部分高度時容易被拉回 FAQ 區塊，導致使用者滑不到最底部；補上 snap-end 讓 Footer 底部本身成為合法的吸附點 */}
      <div className="snap-end">
        <AppFooter />
      </div>
    </div>
  )
}
