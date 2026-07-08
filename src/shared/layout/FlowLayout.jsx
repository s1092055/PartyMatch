import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'

export default function FlowLayout({ onBack, progress, bottomNav, children }) {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="h-1 w-full shrink-0 bg-raised">
        <div
          className="h-full bg-brand transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="shrink-0 px-4 py-4 md:px-8 md:py-6">
        <button
          onClick={onBack}
          aria-label="返回"
          className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <main className={`flex-1 overflow-y-auto px-4 md:px-8 ${bottomNav ? 'pb-28 md:pb-32' : 'pb-8'}`}>
        <div className="mx-auto w-full max-w-xl md:max-w-2xl lg:max-w-4xl">
          {children}
        </div>
      </main>

      {bottomNav && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur md:px-8 md:py-4">
          <div className="mx-auto flex w-full max-w-xl gap-3 md:max-w-2xl lg:max-w-4xl">
            {bottomNav}
          </div>
        </div>
      )}
    </div>
  )
}
