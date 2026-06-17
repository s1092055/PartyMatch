import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useScrollLock } from '../utils/hooks'

// sub=false（預設）：頂層 modal，z-[55/56]，固定高度，Escape 關閉，父層控制掛載
// sub=true：子 modal（疊在其他 modal 上），z-[65]，auto 高度，靠 isOpen prop 控制顯示
export default function Modal({
  isOpen,
  onClose,
  title,
  icon,
  headerEnd,
  footer,
  maxWidth,
  height,
  outerPadding = 'p-4 md:p-8',
  sub = false,
  children,
}) {
  const resolvedMaxWidth = maxWidth ?? (sub ? 'max-w-md' : 'max-w-5xl')
  const controlled = isOpen !== undefined
  useScrollLock(controlled ? !!isOpen : true)

  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (sub) return
    function onKeyDown(e) { if (e.key === 'Escape') onCloseRef.current?.() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [sub])

  if (controlled && !isOpen) return null

  if (sub) {
    return createPortal(
      <div className={`fixed inset-0 z-[65] flex items-center justify-center ${outerPadding}`}>
        <div className="absolute inset-0 cursor-pointer bg-black/50" onClick={onClose} />
        <div className={`relative w-full ${resolvedMaxWidth} card overflow-hidden p-0 animate-fade-in-up`}
             style={height ? { height } : undefined}>
          {(title || icon) && (
            <div className="flex items-center justify-between border-b border-line-subtle px-5 py-4">
              <div className="flex items-center gap-2">
                {icon}
                {title && <h2 className="text-base font-extrabold text-ink">{title}</h2>}
              </div>
              <div className="flex items-center gap-1">
                {headerEnd}
                <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          {children}
          {footer && <div className="flex shrink-0 gap-3 border-t border-line px-6 py-4">{footer}</div>}
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[55] cursor-pointer bg-black/50" onClick={onClose} />
      <div className={`pointer-events-none fixed inset-0 z-[56] flex items-center justify-center ${outerPadding}`}>
        <div
          className={`pointer-events-auto flex w-full ${resolvedMaxWidth} flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl animate-fade-in-up`}
          style={height ? { height } : undefined}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-5">
            <div className="flex items-center gap-2">
              {icon}
              <h2 className="text-lg font-extrabold text-ink">{title}</h2>
            </div>
            <div className="flex items-center gap-1">
              {headerEnd}
              <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink" aria-label="關閉">
                <X size={18} />
              </button>
            </div>
          </div>
          {children}
          {footer && <div className="flex shrink-0 gap-3 border-t border-line px-6 py-4">{footer}</div>}
        </div>
      </div>
    </>,
    document.body
  )
}
