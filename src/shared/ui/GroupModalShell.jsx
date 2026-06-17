import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import ServiceLogo from './ServiceLogo'
import GroupOverviewContent from './GroupOverviewContent'
import GroupSummaryCard from './GroupSummaryCard'
import { useScrollLock } from '../utils/hooks'

// 三個群組詳情 modal（探索、管理、訂閱）共用的佈局殼。
// 負責：overlay、modal 容器、header、兩欄佈局（左：內容、右：摘要卡）、
//       scroll lock、Escape 關閉、左右欄高度同步。
// 各頁差異透過 props 注入：summaryFavoriteSlot / summaryExtraRows / summaryFooter /
//   desktopReviewsSection / mobileReviewsSection / afterColumns / bottomBar / mobileFooter。
// children 用於 sub-modal、ConfirmDialog 等需要接在同一 portal fragment 的元件。

export default function GroupModalShell({
  onClose,
  group,
  service,
  plan,
  summaryFavoriteSlot,
  summaryExtraRows,
  summaryFooter,
  desktopReviewsSection,
  mobileReviewsSection,
  afterColumns,
  bottomBar,
  mobileFooter,
  children,
}) {
  useScrollLock(true)

  const summaryRef    = useRef(null)
  const leftColRef    = useRef(null)
  const scrollBodyRef = useRef(null)

  useEffect(() => {
    function onKeyDown(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useLayoutEffect(() => {
    const syncHeight = () => {
      const summary = summaryRef.current
      const left    = leftColRef.current
      if (!summary || !left) return
      if (window.innerWidth >= 1024) {
        left.style.height = summary.offsetHeight + 'px'
      } else {
        left.style.height = ''
      }
    }
    syncHeight()
    if (scrollBodyRef.current) scrollBodyRef.current.scrollTop = 0
    if (leftColRef.current) leftColRef.current.scrollTop = 0
    const ro = new ResizeObserver(syncHeight)
    if (summaryRef.current) ro.observe(summaryRef.current)
    return () => ro.disconnect()
  }, [group?.id])

  return createPortal(
    <>
      <div className="fixed inset-0 z-[55] bg-black/50" onClick={onClose} />

      <div className="pointer-events-none fixed inset-0 z-[56] flex items-center justify-center p-4 md:p-8">
        <div
          className="pointer-events-auto flex w-full flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl animate-fade-in-up md:max-w-5xl"
          style={{ height: 'min(92vh, 860px)' }}
        >
          {/* ── Header ── */}
          <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-5 lg:px-8">
            <div className="flex items-center gap-2.5">
              <ServiceLogo serviceId={group.serviceId} size={28} className="rounded-lg" />
              <span className="text-lg font-extrabold text-ink">{group.serviceName}</span>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              aria-label="關閉"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── 可捲動內容區 ── */}
          <div ref={scrollBodyRef} className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            {/* 兩欄佈局 */}
            <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:gap-6 lg:p-8">

              {/* 左欄：服務介紹 + 加入規則 + 選填區塊 */}
              <div
                ref={leftColRef}
                className="order-2 min-w-0 flex-1 overflow-y-auto lg:order-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <GroupOverviewContent
                  group={group}
                  service={service}
                  plan={plan}
                  desktopReviewsSection={desktopReviewsSection}
                  mobileReviewsSection={mobileReviewsSection}
                />
              </div>

              {/* 右欄：摘要卡（桌機才顯示） */}
              <div ref={summaryRef} className="hidden lg:order-2 lg:block lg:w-[20rem] lg:shrink-0">
                <GroupSummaryCard
                  group={group}
                  favoriteSlot={summaryFavoriteSlot}
                  extraRows={summaryExtraRows}
                  footer={summaryFooter}
                />
              </div>
            </div>

            {/* 兩欄以下的全寬區塊（例如推薦群組） */}
            {afterColumns}
          </div>

          {/* 手機版黏底列（lg 以上隱藏） */}
          {mobileFooter && (
            <div className="shrink-0 border-t border-line bg-canvas lg:hidden">
              {mobileFooter}
            </div>
          )}

          {/* 固定底部操作列（可同時在手機和桌機顯示） */}
          {bottomBar && (
            <div className="shrink-0 border-t border-line bg-canvas">
              {bottomBar}
            </div>
          )}
        </div>
      </div>

      {/* Sub-modals、ConfirmDialog 等 */}
      {children}
    </>,
    document.body
  )
}
