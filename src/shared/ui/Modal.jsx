import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, X } from 'lucide-react'
import { useScrollLock } from '../utils/hooks'

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
  hideClose = false,
  hideBack = false,
  headerBorder = true,
  showHeader = true,
  children,
}) {
  const resolvedMaxWidth = maxWidth ?? (sub ? 'max-w-md' : 'max-w-5xl')
  const controlled = isOpen !== undefined

  const [shouldRender, setShouldRender] = useState(controlled ? !!isOpen : true)

  useScrollLock(shouldRender)

  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (!controlled) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setShouldRender(true)
    else setShouldRender(false)
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sub) return
    function onKeyDown(e) { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [sub]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    if (controlled) {
      onCloseRef.current?.()
    } else {
      setShouldRender(false)
      onCloseRef.current?.()
    }
  }

  if (!shouldRender) return null

  if (sub) {
    return createPortal(
      <div className={`fixed inset-0 z-[65] flex items-center justify-center ${outerPadding}`}>
        <div
          className="absolute inset-0 cursor-pointer bg-black/50 animate-backdrop-in"
          onClick={handleClose}
        />
        <div
          className={`relative flex w-full flex-col ${resolvedMaxWidth} card overflow-hidden p-0 animate-modal-in`}
          style={height ? { height, maxHeight: 'calc(100vh - 2rem)' } : { maxHeight: 'calc(100vh - 2rem)' }}
        >
          {(title || icon) && (
            <div className="flex items-center border-b border-line-subtle px-3 py-3">
              {hideBack ? (
                <div className="h-9 w-9 shrink-0" />
              ) : (
                <button onClick={handleClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:scale-100 active:opacity-70">
                  <ChevronLeft size={20} />
                </button>
              )}
              <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
                {icon}
                {title && <h2 className="truncate text-base font-extrabold text-ink">{title}</h2>}
              </div>
              {headerEnd && <div className="shrink-0">{headerEnd}</div>}
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">{children}</div>
          {footer && <div className="flex shrink-0 gap-3 border-t border-line px-6 py-4">{footer}</div>}
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[55] cursor-pointer bg-black/50 animate-backdrop-in"
        onClick={handleClose}
      />
      <div className={`pointer-events-none fixed inset-0 z-[56] flex items-center justify-center ${outerPadding}`}>
        <div
          className={`pointer-events-auto flex w-full ${resolvedMaxWidth} flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl animate-modal-in`}
          style={height ? { height } : undefined}
        >
          {showHeader && (
          <div className={`flex shrink-0 items-center justify-between px-6 py-5 ${headerBorder ? 'border-b border-line' : ''}`}>
            <div className="flex items-center gap-2">
              {icon}
              {title && <h2 className="text-lg font-extrabold text-ink">{title}</h2>}
            </div>
            <div className="flex items-center gap-1">
              {headerEnd}
              <button onClick={handleClose} className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:scale-100 active:opacity-70 ${hideClose ? 'max-md:hidden' : ''}`} aria-label="關閉">
                <X size={18} />
              </button>
            </div>
          </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">{children}</div>
          {footer && <div className="flex shrink-0 gap-3 border-t border-line px-6 py-4">{footer}</div>}
        </div>
      </div>
    </>,
    document.body
  )
}
