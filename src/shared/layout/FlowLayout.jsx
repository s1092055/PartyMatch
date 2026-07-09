import { useEffect } from 'react'

// 底部固定導覽列（步驟進度條 + bottomNav 按鈕）疊起來的高度不固定，
// 內容區的下方留白要跟著這兩者是否存在調整，避免內容被固定列擋住
function getBottomPadding(hasBottomNav, hasStepBanner) {
  if (!hasBottomNav) return 'pb-8'
  if (hasStepBanner) return 'pb-36 md:pb-44'
  return 'pb-24 md:pb-28'
}

export default function FlowLayout({ steps, currentStep, title, titleIcon, headerAction, headerBanner, bottomNav, children, maxWidth = 'max-w-xl md:max-w-2xl lg:max-w-[clamp(56rem,70vw,76rem)]' }) {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  const hasStepBanner = bottomNav && steps && steps.length > 0

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <div className="relative flex h-16 shrink-0 items-center justify-end border-b border-line px-4 md:h-20 md:px-8">
        {title && (
          <h1 className="pointer-events-none absolute left-1/2 flex max-w-[60%] -translate-x-1/2 items-center gap-2 truncate text-lg font-extrabold text-ink md:text-xl">
            {titleIcon}
            <span className="truncate">{title}</span>
          </h1>
        )}

        <div>{headerAction}</div>
      </div>

      {headerBanner && <div className="shrink-0">{headerBanner}</div>}

      <main
        className={`min-h-0 flex-1 overflow-hidden px-4 md:px-8 ${getBottomPadding(!!bottomNav, !!hasStepBanner)}`}
      >
        <div className={`mx-auto h-full w-full ${maxWidth}`}>
          {children}
        </div>
      </main>

      {bottomNav && (
        <div className="fixed inset-x-0 bottom-0 z-10" style={{ right: 'var(--scrollbar-compensation, 0px)' }}>
          {hasStepBanner && (
            <div className="border-t border-line bg-raised/70 px-4 py-3 backdrop-blur md:px-8">
              <div className={`mx-auto w-full ${maxWidth}`}>
                <div className="mb-2 flex items-center gap-1.5">
                  {steps.map((label, i) => (
                    <div
                      key={label}
                      className={`h-1 flex-1 rounded-full transition-colors ${i < currentStep ? 'bg-brand' : 'bg-line'}`}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  {steps.map((label, i) => (
                    <span
                      key={label}
                      className={`flex-1 truncate text-center text-sm font-bold ${
                        i + 1 === currentStep ? 'text-brand' : 'text-ink-3'
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex min-h-16 flex-col justify-center border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur md:min-h-20 md:px-8">
            <div className={`mx-auto w-full ${maxWidth}`}>
              <div className="flex gap-3">{bottomNav}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
