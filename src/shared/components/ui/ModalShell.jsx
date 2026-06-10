import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useScrollLock } from '../../utils/hooks'

export default function ModalShell({
  onClose,
  icon,
  title,
  headerEnd,
  footer,
  children,
  maxWidth = 'max-w-5xl',
  height = 'min(85vh, 720px)',
  outerPadding = 'p-4 md:p-8',
}) {
  useScrollLock(true)

  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    function onKeyDown(e) { if (e.key === 'Escape') onCloseRef.current() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return createPortal(
    <>
      <div className="fixed inset-0 z-[55] cursor-pointer bg-black/50" onClick={onClose} />
      <div className={`pointer-events-none fixed inset-0 z-[56] flex items-center justify-center ${outerPadding}`}>
        <div
          className={`pointer-events-auto relative flex w-full ${maxWidth} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
          style={{ height }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-5">
            <div className="flex items-center gap-2">
              {icon}
              <h2 className="text-lg font-extrabold text-ink">{title}</h2>
            </div>
            <div className="flex items-center gap-1">
              {headerEnd}
              <button
                onClick={onClose}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
                aria-label="關閉"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {children}

          {footer && (
            <div className="flex shrink-0 gap-3 border-t border-line px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
