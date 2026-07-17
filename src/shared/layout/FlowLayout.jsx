import { useEffect } from 'react'
import logoUrl from '../../assets/Logo.svg'

export default function FlowLayout({ steps, currentStep, title, titleIcon, headerAction, headerBanner, bottomNav, children, maxWidth = 'max-w-xl md:max-w-2xl lg:max-w-[clamp(56rem,70vw,76rem)]' }) {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  const hasStepBanner = bottomNav && steps && steps.length > 0

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <div className="relative flex h-16 shrink-0 items-center justify-between border-b border-line px-4 md:h-20 md:px-8">
        <a
          href="/"
          aria-label="回首頁"
          className="flex shrink-0 items-center"
        >
          <img src={logoUrl} alt="PartyMatch" className="h-8 w-8" />
        </a>

        {title && (
          <h1 className="pointer-events-none absolute left-1/2 flex max-w-[60%] -translate-x-1/2 items-center gap-2 truncate text-lg font-extrabold text-ink md:text-xl">
            {titleIcon}
            <span className="truncate">{title}</span>
          </h1>
        )}

        <div>{headerAction}</div>
      </div>

      {headerBanner && <div className="shrink-0">{headerBanner}</div>}

      {/* 底部固定導覽列（步驟進度條 + bottomNav 按鈕）疊起來的高度目前用固定值頂開，
          130/160 是配合現有 steps + bottomNav 疊加後的實際高度手動調校；
          若未來有頁面只傳 bottomNav 不傳 steps，或步驟文案變多行導致導覽列變高，
          這兩個值需要一併調整，否則內容可能被蓋住 */}
      <main
        className={`min-h-0 flex-1 overflow-hidden px-4 md:px-8 ${bottomNav ? 'pb-[130px] md:pb-[160px]' : 'pb-8'}`}
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
