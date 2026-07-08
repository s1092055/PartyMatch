import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronLeft, ChevronUp, X } from 'lucide-react'
import ServiceLogo from './ServiceLogo'
import GroupOverviewContent from './GroupOverviewContent'
import ProgressBar from './ProgressBar'
import TokenAmount from './TokenAmount'
import { useScrollLock } from '../utils/hooks'

export default function GroupModalShell({
  onClose,
  group,
  service,
  plan,
  summaryExtraRows,
  extraInfoRows = [],
  afterColumns,
  bottomBar,
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
  mobileReviewsSection,
  children,
}) {
  const [atBottom, setAtBottom] = useState(false)
  const scrollBodyRef  = useRef(null)
  const subScrollRef   = useRef(null)
  const subSubScrollRef = useRef(null)

  function handleClose() { onClose() }
  function handleScroll(e) {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    setAtBottom(scrollTop + clientHeight >= scrollHeight - 20)
  }
  function scrollToTop() { scrollBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }
  function scrollDown()  { scrollBodyRef.current?.scrollBy({ top: 200, behavior: 'smooth' }) }

  const showPaymentBar    = ['pending_activation', 'pending_confirmation'].includes(group.status) && confirmedCount !== undefined
  const showCenteredBadge = (showPaymentBar || !!pendingBadge) && !centeredCta
  const centeredBadgeLabel = pendingBadge ?? '收款確認中'
  const centeredBadgeCls   = pendingBadgeColor === 'success'
    ? 'bg-success-subtle text-success-text'
    : pendingBadgeColor === 'danger'
      ? 'bg-danger-subtle text-danger'
      : 'bg-warning-subtle text-warning-text'

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
    if (scrollBodyRef.current) scrollBodyRef.current.scrollTop = 0
  }, [group?.id])

  // Reset sub-panel scroll when switching panels
  useEffect(() => {
    if (subPanel && subScrollRef.current) subScrollRef.current.scrollTop = 0
  }, [subPanel?.title]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (subSubPanel && subSubScrollRef.current) subSubScrollRef.current.scrollTop = 0
  }, [subSubPanel?.title]) // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <>
      <div className="fixed inset-0 z-[55] bg-black/50 animate-backdrop-in" onClick={handleClose} />

      <div className="pointer-events-none fixed inset-0 z-[56] flex items-center justify-center p-4 md:p-8">
        <div
          className="pointer-events-auto flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl animate-modal-in"
          style={{ height: 'min(92vh, 720px)' }}
        >
          {/* Slide track: 300% wide — 3 equal panels; translateX by -33.33% per step */}
          <div
            className="flex h-full transition-transform duration-300 ease-in-out"
            style={{
              width: '300%',
              transform: subSubPanel
                ? 'translateX(-66.67%)'
                : subPanel
                  ? 'translateX(-33.33%)'
                  : 'translateX(0)',
            }}
          >
            {/* ── MAIN PANEL ── */}
            <div className="flex w-1/3 min-w-0 flex-col overflow-hidden">
              {/* Header */}
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

              {(headerBanner || showCenteredBadge) && (
                <div className="shrink-0">
                  {headerBanner ?? (
                    <div className={`flex items-center justify-center px-6 py-3 text-sm font-extrabold ${centeredBadgeCls}`}>
                      {centeredBadgeLabel}
                    </div>
                  )}
                </div>
              )}

              {/* Scrollable body */}
              <div ref={scrollBodyRef} onScroll={handleScroll} className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                <div className="pointer-events-none sticky bottom-3 flex justify-end pr-3">
                  <button
                    onClick={atBottom ? scrollToTop : scrollDown}
                    className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full border border-line bg-canvas shadow-md text-ink-3 transition-colors hover:text-ink animate-bounce"
                    title={atBottom ? '回到頂部' : '往下捲動'}
                  >
                    {atBottom ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
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
                          amount={group.billingCycle === 'yearly' ? group.pricePerSeat * 12 : group.pricePerSeat}
                          cycle={group.billingCycle === 'yearly' ? 'yearly' : 'monthly'}
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
              {bottomBar && (
                <div className="shrink-0 border-t border-line bg-canvas">{bottomBar}</div>
              )}
            </div>

            {/* ── SUB PANEL ── */}
            <div className="flex w-1/3 min-w-0 flex-col overflow-hidden">
              {/* Sub header */}
              <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-4">
                <button
                  onClick={onSubPanelBack}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                  aria-label="返回"
                >
                  <ChevronLeft size={18} />
                </button>
                {subPanel?.icon && <span className="shrink-0">{subPanel.icon}</span>}
                <span className="min-w-0 flex-1 font-extrabold text-ink">{subPanel?.title ?? ''}</span>
                {subPanel?.headerRight && <div className="shrink-0">{subPanel.headerRight}</div>}
              </div>

              {/* Sticky sub-header (optional non-scrollable section) */}
              {subPanel?.stickyHeader && (
                <div className="shrink-0">{subPanel.stickyHeader}</div>
              )}

              {/* Scrollable sub-body */}
              <div ref={subScrollRef} className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {subPanel?.content}
              </div>

              {/* Sub footer */}
              {subPanel?.footer && (
                <div className="shrink-0 border-t border-line px-5 py-4">
                  {subPanel.footer}
                </div>
              )}
            </div>

            {/* ── SUB-SUB PANEL ── */}
            <div className="flex w-1/3 min-w-0 flex-col overflow-hidden">
              {/* Sub-sub header */}
              <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-4">
                <button
                  onClick={onSubSubPanelBack}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                  aria-label="返回"
                >
                  <ChevronLeft size={18} />
                </button>
                {subSubPanel?.icon && <span className="shrink-0">{subSubPanel.icon}</span>}
                <span className="min-w-0 flex-1 font-extrabold text-ink">{subSubPanel?.title ?? ''}</span>
                {subSubPanel?.headerRight && <div className="shrink-0">{subSubPanel.headerRight}</div>}
              </div>

              {/* Sticky sub-sub-header (optional) */}
              {subSubPanel?.stickyHeader && (
                <div className="shrink-0">{subSubPanel.stickyHeader}</div>
              )}

              {/* Scrollable sub-sub-body */}
              <div ref={subSubScrollRef} className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {subSubPanel?.content}
              </div>

              {/* Sub-sub footer */}
              {subSubPanel?.footer && (
                <div className="shrink-0 border-t border-line px-5 py-4">
                  {subSubPanel.footer}
                </div>
              )}
            </div>
          </div>

          {children}
        </div>
      </div>
    </>,
    document.body
  )
}
