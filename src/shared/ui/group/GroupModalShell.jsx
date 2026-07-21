import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, X } from 'lucide-react'
import ServiceLogo from '../ServiceLogo'
import GroupOverviewContent from './GroupOverviewContent'
import ProgressBar from '../primitives/ProgressBar'
import TokenAmount from '../TokenAmount'
import ScrollHint from '../primitives/ScrollHint'
import { useScrollLock, useScrollEdge } from '../../utils/hooks'
import { calcDisplayPrice, calcDisplayCycle } from '../../utils/pricingUtils'

export default function GroupModalShell({
  onClose,
  group,
  service,
  plan,
  summaryExtraRows,
  extraInfoRows = [],
  afterColumns,
  sideBar,
  mobileFooter,
  hideRecruitBar,
  confirmedCount,
  pendingBadge,
  pendingBadgeColor,
  centeredCta,
  headerBanner,
  statusBadgeOverride,
  subPanel = null,       // { title, icon, headerRight?, stickyHeader?, content, footer? }
  onSubPanelBack = null,
  subSubPanel = null,    // { title, icon, headerRight?, stickyHeader?, content, footer? }
  onSubSubPanelBack = null,
  panelKey = 'overview', // 目前顯示的分頁識別字串；切換時搭配 key 觸發 slide-up 進場動畫
  mobileReviewsSection,
  hideServiceIntro = false, // true 時群組概覽不顯示服務介紹（呼叫端另外用 sideBar 的「服務內容」分頁顯示）
  children,
}) {
  const { scrollRef: scrollBodyRef, elRef: scrollBodyElRef, atBottom, canScroll, isScrolling, handleScroll } = useScrollEdge()

  function handleClose() { onClose() }

  const showPaymentBar    = ['pending_activation', 'pending_confirmation'].includes(group.status) && confirmedCount !== undefined
  const showCenteredBadge = (showPaymentBar || !!pendingBadge) && !centeredCta
  const centeredBadgeLabel = pendingBadge ?? '收款確認中'
  const centeredBadgeCls   = pendingBadgeColor === 'success'
    ? 'bg-success-subtle text-success-text'
    : pendingBadgeColor === 'danger'
      ? 'bg-danger-subtle text-danger-text'
      : 'bg-warning-subtle text-warning-text'

  const activeDetail = subSubPanel ?? subPanel

  useScrollLock(true)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        if (subSubPanel && onSubSubPanelBack) onSubSubPanelBack()
        else if (subPanel && onSubPanelBack) onSubPanelBack()
        else onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, subPanel, onSubPanelBack, subSubPanel, onSubSubPanelBack])

  useEffect(() => {
    if (scrollBodyElRef.current) scrollBodyElRef.current.scrollTop = 0
  }, [group?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <>
      <div className="fixed inset-0 z-[55] bg-black/50 animate-backdrop-in" onClick={handleClose} />

      <div className="pointer-events-none fixed inset-0 z-[56] flex items-center justify-center p-4 md:p-8">
        <div
          className="pointer-events-auto flex w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl animate-modal-in"
          style={{ height: 'min(92vh, 720px)' }}
        >
          {/* Header — 固定不動，翻書效果只作用在下方內容區 */}
          <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
            <div className="flex items-center gap-2.5">
              <ServiceLogo serviceId={group.serviceId} size={26} className="rounded-lg" />
              <span className="text-base font-extrabold text-ink">{group.serviceName}</span>
            </div>
            <button
              onClick={handleClose}
              className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              aria-label="關閉"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
            {/* 每次切換分頁都用 key 強制重新掛載，套用跟首頁一致的 slide-up 進場動畫 */}
            <div key={panelKey} className="flex min-w-0 flex-1 flex-col overflow-hidden animate-step-slide-up">
              {/* Banner 不分頁籤，群組概覽跟其他分頁（服務內容、成員名單等）都要看得到目前的倒數/狀態提醒 */}
              {(headerBanner || showCenteredBadge) && (
                <div className="shrink-0">
                  {headerBanner ?? (
                    <div className={`flex items-center justify-center px-6 py-3 text-sm font-extrabold ${centeredBadgeCls}`}>
                      {centeredBadgeLabel}
                    </div>
                  )}
                </div>
              )}

              {activeDetail ? (
                <>
                  {/* Detail header（sub / sub-sub 共用） */}
                  {/* 有 sideBar 時已有明確的分頁切換入口，不需要返回鍵；沒有 sideBar 的呼叫端（如 MemberGroupView）仍需要返回鍵才能離開這個畫面 */}
                  {(!sideBar || activeDetail.icon || activeDetail.title || activeDetail.headerRight) && (
                    <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-4">
                      {!sideBar && (
                        <button
                          onClick={subSubPanel ? onSubSubPanelBack : onSubPanelBack}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                          aria-label="返回"
                        >
                          <ChevronLeft size={18} strokeWidth={1.5} />
                        </button>
                      )}
                      {activeDetail.icon && <span className="shrink-0">{activeDetail.icon}</span>}
                      <span className="min-w-0 flex-1 font-extrabold text-ink">{activeDetail.title ?? ''}</span>
                      {activeDetail.headerRight && <div className="shrink-0">{activeDetail.headerRight}</div>}
                    </div>
                  )}

                  {/* Sticky header（optional non-scrollable section） */}
                  {activeDetail.stickyHeader && (
                    <div className="shrink-0">{activeDetail.stickyHeader}</div>
                  )}

                  {/* Scrollable body */}
                  <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {activeDetail.content}
                  </div>

                  {/* Footer */}
                  {activeDetail.footer && (
                    <div className="shrink-0 border-t border-line px-5 py-4">
                      {activeDetail.footer}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Scrollable body */}
                  <div className="group relative min-h-0 flex-1">
                    <div ref={scrollBodyRef} onScroll={handleScroll} className="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <div className="px-6 py-5">
                        <GroupOverviewContent
                          group={group}
                          service={service}
                          plan={plan}
                          reviewsSection={mobileReviewsSection}
                          statusBadgeOverride={statusBadgeOverride}
                          extraRows={extraInfoRows}
                          hideServiceIntro={hideServiceIntro}
                        />
                        {summaryExtraRows}
                      </div>
                      {afterColumns}
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 left-0 right-3">
                      <ScrollHint canScroll={canScroll} atBottom={atBottom} isScrolling={isScrolling} />
                    </div>
                  </div>

                  {/* Price / CTA bar */}
                  {centeredCta ? (
                    <div className="shrink-0 border-t border-line bg-canvas px-6 py-2">
                      {centeredCta}
                    </div>
                  ) : !hideRecruitBar ? (
                    <div className="shrink-0 border-t border-line bg-canvas px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="mb-0.5 text-xs font-medium text-ink-4">每位價格</p>
                          <div>
                            <TokenAmount
                              amount={calcDisplayPrice(group.pricePerSeat, group.billingCycle)}
                              cycle={calcDisplayCycle(group.billingCycle)}
                              className="text-2xl font-extrabold"
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="mb-0.5 text-xs text-ink-4">剩餘名額</p>
                          <p className="text-lg font-extrabold text-ink">{group.openSeats} / {group.totalSeats} 位</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <ProgressBar value={group.usedSeats} max={group.totalSeats} />
                      </div>
                    </div>
                  ) : null}

                  {mobileFooter && (
                    <div className="shrink-0 border-t border-line bg-canvas">{mobileFooter}</div>
                  )}
                </>
              )}
            </div>

            {sideBar && (
              <div className="flex shrink-0 flex-row justify-between gap-1 overflow-x-auto border-t border-line bg-canvas p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:w-24 md:flex-col md:justify-start md:overflow-x-hidden md:overflow-y-auto md:border-l md:border-t-0">
                {sideBar}
              </div>
            )}
          </div>

          {children}
        </div>
      </div>
    </>,
    document.body
  )
}
