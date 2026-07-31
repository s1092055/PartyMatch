import { useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogCloseButton } from '../dialog'
import ServiceLogo from '../ServiceLogo'
import GroupOverviewContent from './GroupOverviewContent'
import { Progress } from '../progress'
import TokenAmount from '../TokenAmount'
import ScrollHint from '../primitives/ScrollHint'
import { useScrollEdge } from '../../../common/utils/hooks'
import { calcDisplayPrice, calcDisplayCycle } from '../../../common/utils/pricingUtils'

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
  subSubPanel = null,    // { title, icon, headerRight?, stickyHeader?, content, footer?, floatingBack? }
  onSubSubPanelBack = null,
  panelKey = 'overview', // 目前顯示的分頁識別字串；切換時搭配 key 觸發 slide-up 進場動畫
  mobileReviewsSection,
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
      : pendingBadgeColor === 'gray'
        ? 'bg-raised text-ink-2'
        : 'bg-warning-subtle text-warning-text'

  const activeDetail = subSubPanel ?? subPanel
  // 有 sideBar 時已有明確的分頁切換入口，subPanel 不需要返回鍵；但 subSubPanel（例如審核紀錄）是從
  // subPanel 內部圖示鑽進去的，側邊欄沒有對應入口可以退出，一律要顯示返回鍵
  const showBackButton = !sideBar || !!subSubPanel
  // 返回鍵改成浮動在內容左上角、不佔用整列標頭高度，由呼叫端透過 subSubPanel.floatingBack
  // 明確宣告（而不是從「沒有 icon/title/stickyHeader」反推），目前只有審核紀錄的完全空狀態會用到——
  // 不然空狀態置中的位置會比同層的 subPanel（例如申請管理）明顯偏低
  const floatingBackButton = !!subSubPanel?.floatingBack
  const showHeaderRow = (showBackButton && !floatingBackButton) || activeDetail?.icon || activeDetail?.title || activeDetail?.headerRight

  function handleEscapeKeyDown(e) {
    e.preventDefault()
    if (subSubPanel && onSubSubPanelBack) onSubSubPanelBack()
    else if (subPanel && onSubPanelBack) onSubPanelBack()
    else onClose()
  }

  useEffect(() => {
    if (scrollBodyElRef.current) scrollBodyElRef.current.scrollTop = 0
  }, [group?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent maxWidth="max-w-xl" height="min(92dvh, 720px)" onEscapeKeyDown={handleEscapeKeyDown}>
          <DialogTitle className="sr-only">{group.serviceName}</DialogTitle>
          <DialogDescription>{group.serviceName}</DialogDescription>
          {/* Header — 固定不動，翻書效果只作用在下方內容區 */}
          <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <ServiceLogo serviceId={group.serviceId} size={26} className="shrink-0 rounded-lg" />
              <span className="min-w-0 truncate text-base font-extrabold text-ink">
                {group.serviceName}
                {group.planName && (
                  <span className="font-medium text-ink-3"> | {group.planName}</span>
                )}
              </span>
            </div>
            <DialogCloseButton />
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
            <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
              {/* Banner 不分頁籤，群組概覽跟其他分頁（服務內容、成員名單等）都要看得到目前的倒數/狀態提醒；
                  放在 key={panelKey} 的區塊外面，切換分頁時才不會跟著重新播放 slide-up 進場動畫 */}
              {(headerBanner || showCenteredBadge) && (
                <div className="shrink-0">
                  {headerBanner ?? (
                    <div className={`flex items-center justify-center px-6 py-3 text-sm font-extrabold ${centeredBadgeCls}`}>
                      {centeredBadgeLabel}
                    </div>
                  )}
                </div>
              )}

              {/* 每次切換分頁都用 key 強制重新掛載，套用跟首頁一致的 slide-up 進場動畫 */}
              <div key={panelKey} className="relative flex min-h-0 flex-1 flex-col overflow-hidden animate-step-slide-up">
                {activeDetail ? (
                  <>
                    {floatingBackButton && (
                      <button
                        onClick={subSubPanel ? onSubSubPanelBack : onSubPanelBack}
                        className="absolute left-3 top-3 z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                        aria-label="返回"
                      >
                        <ChevronLeft size={18} strokeWidth={1.5} />
                      </button>
                    )}

                    {/* Detail header（sub / sub-sub 共用）；有 sideBar 時固定保留一個返回鍵大小的佔位，
                        不管有沒有顯示按鈕，讓 icon/title 起始位置在各分頁之間切換時保持一致，不會忽有忽無地跳動 */}
                    {showHeaderRow && (
                      <div className={`flex shrink-0 items-center gap-2 px-4 py-4 ${activeDetail.headerBorder === false ? '' : 'border-b border-line'}`}>
                        {showBackButton && !floatingBackButton ? (
                          <button
                            onClick={subSubPanel ? onSubSubPanelBack : onSubPanelBack}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                            aria-label="返回"
                          >
                            <ChevronLeft size={18} strokeWidth={1.5} />
                          </button>
                        ) : (
                          <div className="h-8 w-8 shrink-0" />
                        )}
                        {activeDetail.icon && <span className="shrink-0">{activeDetail.icon}</span>}
                        {(activeDetail.icon || activeDetail.title) && (
                          <span className="min-w-0 flex-1 font-extrabold text-ink">{activeDetail.title ?? ''}</span>
                        )}
                        {activeDetail.headerRight && <div className="min-w-0 flex-1">{activeDetail.headerRight}</div>}
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
                          />
                          {summaryExtraRows}
                        </div>
                        {afterColumns}
                      </div>
                      <div className="pointer-events-none absolute inset-0">
                        <ScrollHint canScroll={canScroll} atBottom={atBottom} isScrolling={isScrolling} />
                      </div>
                    </div>

                    {/* Price / CTA bar；centeredCta 移到下面、key={panelKey} 區塊外面統一處理，
                        這樣切到其他分頁（成員名單、申請管理等）時也看得到，不會只有概覽才有 */}
                    {!centeredCta && !hideRecruitBar ? (
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
                          <Progress value={group.usedSeats} max={group.totalSeats} />
                        </div>
                      </div>
                    ) : null}

                    {mobileFooter && (
                      <div className="shrink-0 border-t border-line bg-canvas">{mobileFooter}</div>
                    )}
                  </>
                )}
              </div>

              {/* centeredCta（例如鎖定群組、啟用服務、填寫帳號、確認服務）放在 key={panelKey} 外面，
                  所有分頁都會持續顯示，不會切到成員名單/申請管理等分頁就消失 */}
              {centeredCta && (
                <div className="shrink-0 border-t border-line bg-canvas px-6 py-2">
                  {centeredCta}
                </div>
              )}
            </div>

            {sideBar && (
              <div className="flex shrink-0 flex-row justify-between gap-1 overflow-x-auto border-t border-line bg-canvas p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:order-first md:w-24 md:flex-col md:justify-start md:overflow-x-hidden md:overflow-y-auto md:border-r md:border-t-0">
                {sideBar}
              </div>
            )}
          </div>

          {children}
      </DialogContent>
    </Dialog>
  )
}
