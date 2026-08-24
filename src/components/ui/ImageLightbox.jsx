import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useScrollLock } from '../../common/utils/hooks'

const SWIPE_THRESHOLD = 40

export default function ImageLightbox(
  { url, alt, onClose, caption, imageClassName = 'max-h-full max-w-full object-contain', onPrev, onNext }
) {
  const dragRef = useRef({ startX: 0, dragging: false });

  useScrollLock(true)

  function handlePointerDown(e) {
    if (e.pointerType !== 'touch' || (!onPrev && !onNext)) return
    dragRef.current = { startX: e.clientX, dragging: true }
  }

  function handlePointerUp(e) {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    const deltaX = e.clientX - dragRef.current.startX
    if (deltaX > SWIPE_THRESHOLD) onPrev?.()
    else if (deltaX < -SWIPE_THRESHOLD) onNext?.()
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      } else if (e.key === 'ArrowLeft') {
        onPrev?.()
      } else if (e.key === 'ArrowRight') {
        onNext?.()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [onClose, onPrev, onNext])

  return createPortal(
    <div
      data-image-lightbox
      className="pointer-events-auto fixed inset-0 z-[80] flex animate-backdrop-in items-center justify-center bg-black/95 p-4"
      onClick={e => { e.stopPropagation(); onClose() }}
    >
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        aria-label="關閉"
        className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X size={18} strokeWidth={1.5} />
      </button>
      {onPrev && (
        <button
          onClick={e => { e.stopPropagation(); onPrev() }}
          aria-label="上一張"
          className="absolute left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:grid"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
      )}
      {onNext && (
        <button
          onClick={e => { e.stopPropagation(); onNext() }}
          aria-label="下一張"
          className="absolute right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:grid"
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>
      )}
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          <img
            src={url}
            alt={alt ?? '附件'}
            className={`block touch-pan-y select-none rounded-2xl ${imageClassName}`}
            onClick={e => e.stopPropagation()}
            onPointerDown={e => { e.stopPropagation(); handlePointerDown(e) }}
            onPointerUp={e => { e.stopPropagation(); handlePointerUp(e) }}
          />
          {caption && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black/80 via-black/10 to-transparent p-4">
              {caption}
            </div>
          )}
        </div>
        {(onPrev || onNext) && (
          <div className="flex items-center gap-3 sm:hidden">
            <button
              onClick={e => { e.stopPropagation(); onPrev?.() }}
              aria-label="上一張"
              disabled={!onPrev}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onNext?.() }}
              aria-label="下一張"
              disabled={!onNext}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
