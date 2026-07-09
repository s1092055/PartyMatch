import { useEffect } from 'react'

export default function FlowLayout({ progress, title, headerAction, footerNote, bottomNav, children, maxWidth = 'max-w-xl md:max-w-2xl lg:max-w-[clamp(56rem,70vw,76rem)]' }) {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <div className="h-1 w-full shrink-0 bg-raised">
        <div
          className="h-full bg-brand transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="relative flex h-16 shrink-0 items-center justify-end border-b border-line px-4 md:h-20 md:px-8">
        {title && (
          <h1 className="pointer-events-none absolute left-1/2 max-w-[60%] -translate-x-1/2 truncate text-center text-lg font-extrabold text-ink md:text-xl">
            {title}
          </h1>
        )}

        <div>{headerAction}</div>
      </div>

      <main
        className={`min-h-0 flex-1 overflow-hidden px-4 md:px-8 ${
          bottomNav ? `${footerNote ? 'pb-36' : 'pb-20'} md:pb-24` : 'pb-8'
        }`}
      >
        <div className={`mx-auto h-full w-full ${maxWidth}`}>
          {children}
        </div>
      </main>

      {bottomNav && (
        <div
          className="fixed inset-x-0 bottom-0 z-10 flex min-h-16 flex-col justify-center border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur md:min-h-20 md:px-8"
          style={{ right: 'var(--scrollbar-compensation, 0px)' }}
        >
          <div className={`mx-auto w-full ${maxWidth}`}>
            {footerNote && <div className="mb-2 space-y-2">{footerNote}</div>}
            <div className="flex gap-3">{bottomNav}</div>
          </div>
        </div>
      )}
    </div>
  )
}
