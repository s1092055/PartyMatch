import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useScrollLock } from '../../../common/utils/hooks'
import { MacFrame } from '../../../components/ui/DeviceFrame'

const DRAG_THRESHOLD = 40 // px，超過這個距離才算滑動切換，不然當成點擊放大

// 放大檢視用獨立的全螢幕 lightbox，不透過 shared Modal——Modal 的內容區固定
// overflow-x-hidden 並以視窗寬度為準把內容「縮」進去，手機上會跟縮圖看起來一樣大，
// 失去放大的意義；這裡直接放大版的外框呈現。step 是獨立於縮圖的本地 state（從目前
// 縮圖的步驟帶入初始值），放大後切換步驟不會影響關閉後縮圖顯示的步驟
export function Lightbox({ screenshots, title, desc, initialStep, onClose }) {
  const [step, setStep] = useState(initialStep)
  const src = screenshots[step]
  const stepLabel = `${title} 第 ${step + 1} 步`
  useScrollLock(true)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setStep(s => Math.max(s - 1, 0))
      if (e.key === 'ArrowRight') setStep(s => Math.min(s + 1, screenshots.length - 1))
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, screenshots.length])

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 pt-16 animate-backdrop-in"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="關閉"
        className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-ink text-white shadow-lg transition-colors hover:bg-ink-2"
      >
        <X size={20} strokeWidth={1.5} />
      </button>

      <div className="flex w-full max-w-4xl min-w-0 flex-col items-center" onClick={e => e.stopPropagation()}>
        <h3 className="mb-4 text-center text-lg font-extrabold text-white">
          {title}
          {screenshots.length > 1 && (
            <span className="ml-2 text-sm font-medium text-white/60">第 {step + 1} 步</span>
          )}
        </h3>

        <MacFrame src={src} alt={stepLabel} className="w-full" />

        {screenshots.length > 1 && (
          <div className="mt-5 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setStep(s => Math.max(s - 1, 0))}
              disabled={step === 0}
              aria-label="上一張"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <div className="flex items-center gap-1.5">
              {screenshots.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  aria-label={`查看第 ${i + 1} 步`}
                  className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(s => Math.min(s + 1, screenshots.length - 1))}
              disabled={step === screenshots.length - 1}
              aria-label="下一張"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </div>
        )}

        {desc && (
          <p className="mt-5 max-w-2xl text-center text-sm leading-relaxed text-white/80">{desc}</p>
        )}
      </div>
    </div>,
    document.body
  )
}

// 多步驟截圖可以左右拖曳切換（也保留下方步驟點），拖曳距離太短則視為點擊放大；
// 截圖來源見 DeviceFrame.jsx 註解
export default function DeviceShowcase({ screenshots, title, desc }) {
  const [step, setStep] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const dragRef = useRef(null)
  const src = screenshots[step]
  const stepLabel = `${title} 第 ${step + 1} 步`

  function handlePointerDown(e) {
    dragRef.current = { startX: e.clientX }
  }

  function handlePointerUp(e) {
    if (!dragRef.current) return
    const deltaX = e.clientX - dragRef.current.startX
    dragRef.current = null

    if (screenshots.length > 1 && Math.abs(deltaX) > DRAG_THRESHOLD) {
      if (deltaX < 0) setStep(s => Math.min(s + 1, screenshots.length - 1))
      else setStep(s => Math.max(s - 1, 0))
    } else {
      setZoomed(true)
    }
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { dragRef.current = null }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setZoomed(true) }}
        aria-label={`放大查看：${stepLabel}`}
        className="block w-full cursor-pointer touch-pan-y select-none"
      >
        <MacFrame src={src} alt={stepLabel} className="w-full" />
      </div>

      {screenshots.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {screenshots.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`查看第 ${i + 1} 步`}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-brand' : 'w-1.5 bg-line'}`}
            />
          ))}
        </div>
      )}

      {zoomed && (
        <Lightbox screenshots={screenshots} title={title} desc={desc} initialStep={step} onClose={() => setZoomed(false)} />
      )}
    </div>
  )
}
