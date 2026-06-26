import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronLeft, ChevronUp, X } from 'lucide-react'
import ServiceLogo from './ServiceLogo'
import GroupOverviewContent from './GroupOverviewContent'
import ProgressBar from './ProgressBar'
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
  subPanel = null,       // { title, icon, stickyHeader?, content, footer? }
  onSubPanelBack = null,
  mobileReviewsSection,
  children,
}) {
  const [atBottom, setAtBottom] = useState(false)
  const scrollBodyRef = useRef(null)
  const subScrollRef  = useRef(null)

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
        if (subPanel && onSubPanelBack) onSubPanelBack()
        else onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, subPanel, onSubPanelBack])

  useEffect(() => {
    if (scrollBodyRef.current) scrollBodyRef.current.scrollTop = 0
  }, [group?.id])

  // Reset sub-panel scroll when switching panels (intentionally depends on title only, not the whole object)
  useEffect(() => {
    if (subPanel && subScrollRef.current) subScrollRef.current.scrollTop = 0
  }, [subPanel?.title]) // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <>
      <div className="fixed inset-0 z-[55] bg-black/50 animate-backdrop-in" onClick={handleClose} />

      <div className="pointer-events-none fixed inset-0 z-[56] flex items-center justify-center p-4 md:p-8">
        <div
          className="pointer-events-auto flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl animate-modal-in"
          style={{ height: 'min(92vh, 720px)' }}
        >
          {/* Slide track: 200% wide, translates to show main or sub panel */}
          <div
            className="flex h-full transition-transform duration-300 ease-in-out"
            style={{ width: '200%', transform: subPanel ? 'translateX(-50%)' : 'translateX(0)' }}
          >
            {/* ── MAIN PANEL ── */}
            <div className="flex w-1/2 min-w-0 flex-col overflow-hidden">
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
                      <p className="mb-0.5 text-xs font-medium text-ink-4">每席價格</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-ink">NT${group.pricePerSeat}</span>
                        <span className="text-sm text-ink-3">/每月</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="mb-0.5 text-xs text-ink-4">剩餘名額</p>
                      <p className="text-lg font-extrabold text-ink">{group.openSeats} / {group.totalSeats} 席</p>
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
            <div className="flex w-1/2 min-w-0 flex-col overflow-hidden">
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
                <span className="font-extrabold text-ink">{subPanel?.title ?? ''}</span>
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
          </div>

          {children}
        </div>
      </div>
    </>,
    document.body
  )
}
