import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import ServiceLogo from './ServiceLogo'
import GroupOverviewContent from './GroupOverviewContent'
import ProgressBar from './ProgressBar'
import Badge from './Badge'
import { TagChip } from './GroupOverviewContent'
import { getInfoRows } from '../utils/groupDisplay'
import { useScrollLock } from '../utils/hooks'

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
  hideRecruitBar,
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

          <div ref={scrollBodyRef} className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex flex-col gap-4 px-6 pb-0 pt-3 lg:flex-row lg:items-start lg:gap-6 lg:p-8">
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

              <div ref={summaryRef} className="hidden lg:order-2 lg:block lg:w-[20rem] lg:shrink-0">
                {(() => {
                  const infoRows = getInfoRows(group)
                  const tags = group.tags ?? []
                  return (
                    <div className="card divide-y divide-line-subtle overflow-hidden">
                      {!hideRecruitBar && (
                        <div className="flex items-start justify-between px-6 py-4 lg:px-8">
                          <div>
                            <p className="mb-0.5 text-xs font-medium text-ink-4">每席價格</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-extrabold text-ink">NT${group.pricePerSeat}</span>
                              <span className="text-sm text-ink-3">/每月</span>
                            </div>
                          </div>
                          {summaryFavoriteSlot}
                        </div>
                      )}

                      {!hideRecruitBar && (
                        <div className="px-6 py-4 lg:px-8">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-ink-3">剩餘名額</span>
                            <span className="font-semibold text-ink">{group.openSeats} 位</span>
                          </div>
                          <ProgressBar value={group.usedSeats} max={group.totalSeats} />
                        </div>
                      )}

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-6 py-4 lg:px-8">
                          {tags.map(tag => <TagChip key={tag} label={tag} />)}
                        </div>
                      )}

                      {infoRows.length > 0 && (
                        <div className="px-6 py-4 lg:px-8">
                          <div className="space-y-2">
                            {infoRows.map(({ label, value, badge }) => (
                              <div key={label} className="flex gap-3 text-sm">
                                <span className="w-14 shrink-0 text-ink-4">{label}</span>
                                <span className="flex-1 text-ink-2">
                                  {badge ? <Badge variant={badge} /> : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {summaryExtraRows}
                      {summaryFooter}
                    </div>
                  )
                })()}
              </div>
            </div>

            {afterColumns}
          </div>

          {!hideRecruitBar && (
            <div className="shrink-0 border-t border-line-subtle bg-canvas px-6 py-3 lg:hidden">
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <p className="mb-0.5 text-xs text-ink-4">每席價格</p>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-extrabold text-ink">NT${group.pricePerSeat}</span>
                    <span className="text-xs text-ink-3">/每月</span>
                  </div>
                </div>
                <div className="flex-1">
                  <ProgressBar value={group.usedSeats} max={group.totalSeats} />
                </div>
                <div className="shrink-0 text-right">
                  <p className="mb-0.5 text-xs text-ink-4">剩餘名額</p>
                  <p className="text-sm font-semibold text-ink">{group.openSeats} / {group.totalSeats} 席</p>
                </div>
              </div>
            </div>
          )}

          {mobileFooter && (
            <div className="shrink-0 border-t border-line bg-canvas lg:hidden">
              {mobileFooter}
            </div>
          )}

          {bottomBar && (
            <div className="shrink-0 border-t border-line bg-canvas">
              {bottomBar}
            </div>
          )}
        </div>
      </div>

      {children}
    </>,
    document.body
  )
}
