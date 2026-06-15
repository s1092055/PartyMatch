import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Play, X, VideoOff } from 'lucide-react'
import { useScrollLock } from '../../../shared/utils/hooks'

const STEPS = [
  {
    step: 1,
    title: '選擇訂閱服務',
    desc: '決定你想分攤的服務，例如 Netflix、Spotify 或 ChatGPT，支援 30 種以上。',
    videoUrl: null,
  },
  {
    step: 2,
    title: '瀏覽或配對群組',
    desc: '自己篩選合適的群組，或讓快速配對系統根據你的條件自動推薦。',
    videoUrl: null,
  },
  {
    step: 3,
    title: '送出申請',
    desc: '找到喜歡的群組就送出申請，等待團主審核，通常在 24–48 小時內回覆。',
    videoUrl: null,
  },
  {
    step: 4,
    title: '完成付款',
    desc: '申請通過後，依照團主指定方式完成分攤費用，並在平台標記付款。',
    videoUrl: null,
  },
  {
    step: 5,
    title: '追蹤訂閱狀態',
    desc: '在「我的訂閱」查看付款紀錄、下次續訂時間，有問題可直接聯絡團主。',
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
  const [index, setIndex] = useState(0)
  const [modalIndex, setModalIndex] = useState(null)
  const total = STEPS.length

  function prev() { setIndex(i => Math.max(0, i - 1)) }
  function next() { setIndex(i => Math.min(total - 1, i + 1)) }

  return (
    <>
      <section className="py-6">
        <div className="mb-8 text-center">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ink-4">使用流程</p>
          <h2 className="text-3xl font-extrabold text-ink">如何使用 PartyMatch</h2>
          <p className="mt-3 flex items-center justify-center gap-1 text-base text-ink-3">
            <Play size={10} className="fill-current" />
            點擊步驟卡片，即可觀看對應的教學影片
          </p>
        </div>

        <div className="mx-auto max-w-lg">
          {/* Slide */}
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {STEPS.map(({ step, title, desc, videoUrl }, i) => (
                <button
                  key={step}
                  onClick={() => setModalIndex(i)}
                  className="group w-full shrink-0 cursor-pointer"
                >
                  <div className="card flex flex-col items-center gap-5 p-8 text-center transition-shadow hover:shadow-md">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand text-xl font-extrabold text-white">
                      {step}
                      {videoUrl && (
                        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-brand opacity-0 transition-opacity group-hover:opacity-100">
                          <Play size={18} className="fill-white text-white" />
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-ink">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-3">{desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              disabled={index === 0}
              className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-3 transition-colors hover:border-line-strong hover:text-ink disabled:opacity-30"
              aria-label="上一步"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-2">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    i === index ? 'w-5 bg-brand' : 'w-2 bg-line hover:bg-ink-4'
                  }`}
                  aria-label={`第 ${i + 1} 步`}
                />
              ))}
            </div>
            <button
              onClick={next}
              disabled={index === total - 1}
              className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-3 transition-colors hover:border-line-strong hover:text-ink disabled:opacity-30"
              aria-label="下一步"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {modalIndex !== null && (
        <TutorialModal initialIndex={modalIndex} onClose={() => setModalIndex(null)} />
      )}
    </>
  )
}
