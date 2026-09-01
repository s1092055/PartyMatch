import { useEffect, useRef } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogCloseButton } from '../dialog'
import ServiceLogo from '../ServiceLogo'
import GroupOverviewContent from './GroupOverviewContent'
import GroupPriceSeatSummary from './GroupPriceSeatSummary'

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
  subPanel = null,
  onSubPanelBack = null,
  subSubPanel = null,
  onSubSubPanelBack = null,
  panelKey = 'overview',
  mobileReviewsSection,
  desktopAsideTop,
  desktopAsideBottom,
  mobileFab,
  children,
}) {
  const scrollBodyElRef = useRef(null)

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
  const showBackButton = !sideBar || !!subSubPanel;
  const floatingBackButton = !!subSubPanel?.floatingBack;
  const showHeaderRow = (showBackButton && !floatingBackButton) || activeDetail?.icon || activeDetail?.title || activeDetail?.headerRight
  const handleBack = subSubPanel ? onSubSubPanelBack : onSubPanelBack

  function handleEscapeKeyDown(e) {
    e.preventDefault()
    if (subSubPanel && onSubSubPanelBack) onSubSubPanelBack()
    else if (subPanel && onSubPanelBack) onSubPanelBack()
    else onClose()
  }

  useEffect(() => {
    if (scrollBodyElRef.current) scrollBodyElRef.current.scrollTop = 0
  }, [group?.id])

  return (
    <Dialog open onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="relative" maxWidth={desktopAsideTop ? 'max-w-xl lg:max-w-3xl' : 'max-w-xl'} height="min(92dvh, 720px)" onEscapeKeyDown={handleEscapeKeyDown}>
        <DialogTitle className="sr-only">{group.serviceName}</DialogTitle>
        <DialogDescription>{group.serviceName}</DialogDescription>

        <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <ServiceLogo serviceId={group.serviceId} size={26} className="shrink-0" />
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

            {(headerBanner || showCenteredBadge) && (
              <div className="shrink-0">
                {headerBanner ?? (
                  <div className={`flex items-center justify-center px-6 py-3 text-sm font-extrabold ${centeredBadgeCls}`}>
                    {centeredBadgeLabel}
                  </div>
                )}
              </div>
            )}

            <div key={panelKey} className="relative flex min-h-0 flex-1 flex-col overflow-hidden animate-step-slide-up">
              {activeDetail ? (
                <>
                  {floatingBackButton && (
                    <button
                      onClick={handleBack}
                      className="absolute left-3 top-3 z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                      aria-label="返回"
                    >
                      <ChevronLeft size={18} strokeWidth={1.5} />
                    </button>
                  )}

                  {showHeaderRow && (
                    <div className={`flex shrink-0 items-center gap-2 px-4 py-4 ${activeDetail.headerBorder === false ? '' : 'border-b border-line'}`}>
                      {showBackButton && !floatingBackButton ? (
                        <button
                          onClick={handleBack}
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

                  {activeDetail.stickyHeader && (
                    <div className="shrink-0">{activeDetail.stickyHeader}</div>
                  )}

                  <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {activeDetail.content}
                  </div>

                  {activeDetail.footer && (
                    <div className="shrink-0 border-t border-line px-5 py-4">
                      {activeDetail.footer}
                    </div>
                  )}
                </>
              ) : (
                <>

                  <div className="min-h-0 flex-1">
                    <div ref={scrollBodyElRef} className="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  </div>

                  {!centeredCta && !hideRecruitBar ? (
                    <div className="shrink-0 border-t border-line bg-canvas px-6 py-4">
                      <GroupPriceSeatSummary group={group} />
                    </div>
                  ) : null}
                  {mobileFooter && (
                    <div className="shrink-0 border-t border-line bg-canvas">{mobileFooter}</div>
                  )}
                </>
              )}
            </div>

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

          {desktopAsideTop && (
            <div className="hidden lg:flex lg:w-80 lg:shrink-0 lg:flex-col lg:border-l lg:border-line">
              <div className="min-h-0 flex-1 overflow-hidden px-5 py-5">
                {desktopAsideTop}
              </div>
              {desktopAsideBottom && (
                <div className="shrink-0 border-t border-line bg-canvas px-5 py-4">
                  {desktopAsideBottom}
                </div>
              )}
            </div>
          )}
        </div>
        {mobileFab && !activeDetail && (
          <div className={`absolute right-4 z-10 md:hidden ${centeredCta ? 'bottom-40' : 'bottom-20'}`}>
            {mobileFab}
          </div>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
