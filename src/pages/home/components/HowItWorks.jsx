import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Play, X, VideoOff } from 'lucide-react'
import { useScrollLock } from '../../../shared/utils/hooks'

const STEPS = [
  {
    step: 1,
    title: '選擇服務',
    desc: '決定你想分攤的訂閱服務，例如 Netflix、Spotify 或 ChatGPT。',
    videoUrl: null,
  },
  {
    step: 2,
    title: '加入或建立群組',
    desc: '找到適合的群組申請加入，或是自己開一個群組招募成員。',
    videoUrl: null,
  },
  {
    step: 3,
    title: '等待團主審核',
    desc: '送出申請後，等候團主確認你的加入資格，通常在 24–48 小時內回覆。',
    videoUrl: null,
  },
  {
    step: 4,
    title: '管理訂閱與付款',
    desc: '在「我的訂閱」查看付款狀態、繳費紀錄和下次續訂時間。',
    videoUrl: null,
  },
]

function TutorialModal({ initialIndex, onClose }) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const iframeRef = useRef(null)
  const current = STEPS[activeIndex]
  useScrollLock(true)

  const goTo = useCallback((updater) => {
    if (iframeRef.current) iframeRef.current.src = ''
    setTimeout(() => setActiveIndex(updater), 0)
  }, [])

  const handleClose = useCallback(() => {
    if (iframeRef.current) iframeRef.current.src = ''
    onClose()
  }, [onClose])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowLeft') goTo(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') goTo(i => Math.min(STEPS.length - 1, i + 1))
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [handleClose, goTo])

  return createPortal(
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 px-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-extrabold text-white">
              {current.step}
            </span>
            <h3 className="text-sm font-extrabold text-ink">{current.title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
            aria-label="關閉"
          >
            <X size={16} />
          </button>
        </div>

        <div className="aspect-video w-full overflow-hidden rounded-b-2xl bg-black">
          {current.videoUrl ? (
            <iframe
              key={activeIndex}
              ref={iframeRef}
              src={current.videoUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/40">
              <VideoOff size={36} />
              <p className="text-sm font-medium">教學影片準備中</p>
              <p className="text-xs">即將推出，敬請期待</p>
            </div>
          )}
        </div>

        <button
          onClick={() => goTo(i => Math.max(0, i - 1))}
          disabled={activeIndex === 0}
          className="absolute -left-4 top-1/2 grid h-9 w-9 place-items-center rounded-full border border-line bg-white shadow-md text-ink-3 transition-colors hover:bg-raised hover:text-ink disabled:opacity-30"
          aria-label="上一個教學"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => goTo(i => Math.min(STEPS.length - 1, i + 1))}
          disabled={activeIndex === STEPS.length - 1}
          className="absolute -right-4 top-1/2 grid h-9 w-9 place-items-center rounded-full border border-line bg-white shadow-md text-ink-3 transition-colors hover:bg-raised hover:text-ink disabled:opacity-30"
          aria-label="下一個教學"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>,
    document.body
  )
}

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(null)

  return (
    <>
      <section className="p-6">
        <div className="mb-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ink-4 text-center">使用流程</p>
          <h2 className="text-3xl font-extrabold text-ink text-center">如何使用 PartyMatch</h2>
          <p className="mt-3 flex items-center gap-1 text-base text-ink-3 justify-center">
            <Play size={10} className="fill-current" />
            點擊任一步驟，即可觀看對應的教學影片
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ step, title, desc }, i) => (
            <button
              key={step}
              onClick={() => setActiveStep(i)}
              className="group flex gap-4 rounded-xl p-3 text-left transition-colors hover:bg-raised md:flex-col md:gap-3"
            >
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white">
                {step}
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-brand opacity-0 transition-opacity group-hover:opacity-100">
                  <Play size={14} className="fill-white text-white" />
                </span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{desc}</p>
                <p className="mt-2 text-xs font-bold text-brand opacity-0 transition-opacity group-hover:opacity-100">
                  觀看教學 →
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {activeStep !== null && (
        <TutorialModal initialIndex={activeStep} onClose={() => setActiveStep(null)} />
      )}
    </>
  )
}
