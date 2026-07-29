import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Modal from '../../../shared/ui/primitives/Modal'
import DeviceShowcase from './DeviceShowcase'
import { HOME_EXTRA_FEATURES } from '../data/homeContent'

const TOTAL = HOME_EXTRA_FEATURES.length

// 以「轉盤」方式計算與目前聚焦卡片的相對位置（circular，永遠取最短距離）
function getOffset(index, active) {
  let diff = (index - active) % TOTAL
  if (diff > TOTAL / 2) diff -= TOTAL
  if (diff < -TOTAL / 2) diff += TOTAL
  return diff
}

function cardStyle(offset) {
  const abs = Math.abs(offset)
  if (abs > 2) {
    return { transform: 'translateX(-50%) scale(0.5)', opacity: 0, zIndex: 0, pointerEvents: 'none' }
  }
  const translateX = offset * 62 // %
  const translateZ = -abs * 140
  const rotateY = offset * -30
  const scale = 1 - abs * 0.15
  const blur = abs * 3
  const opacity = 1 - abs * 0.4
  return {
    transform: `translateX(-50%) translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
    filter: blur ? `blur(${blur}px)` : 'none',
    opacity,
    zIndex: 10 - abs,
  }
}

function CardThumb({ screenshots, title }) {
  return (
    <div className="aspect-video w-full shrink-0 overflow-hidden bg-raised">
      <img src={screenshots[0]} alt={title} className="h-full w-full object-cover object-top" loading="lazy" />
    </div>
  )
}

export default function ExtraFeatures() {
  const [active, setActive] = useState(0)
  const [openIndex, setOpenIndex] = useState(null)
  const openFeature = openIndex !== null ? HOME_EXTRA_FEATURES[openIndex] : null

  function go(delta) {
    setActive(prev => (prev + delta + TOTAL) % TOTAL)
  }

  function handleCardClick(i, isActive) {
    if (isActive) setOpenIndex(i)
    else setActive(i)
  }

  return (
    <section>
      <div className="mx-auto mb-8 max-w-5xl px-5 text-center">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ink-4">附加功能</p>
        <h2 className="text-3xl font-extrabold text-ink">更完善的體驗？</h2>
        <p className="mt-3 text-base text-ink-3">除了核心功能，這些小工具讓整個流程更順暢。</p>
      </div>

      <div className="relative h-80 select-none overflow-hidden" style={{ perspective: '1400px' }}>
        {HOME_EXTRA_FEATURES.map((feature, i) => {
          const { title, desc, screenshots } = feature
          const offset = getOffset(i, active)
          const isActive = offset === 0
          return (
            <div
              key={title}
              className="absolute left-1/2 top-0 h-full w-64 transition-[transform,filter,opacity] duration-500 ease-out will-change-transform sm:w-72"
              style={cardStyle(offset)}
            >
              <div
                onClick={() => handleCardClick(i, isActive)}
                role="button"
                tabIndex={isActive ? 0 : -1}
                aria-label={isActive ? `放大播放：${title}` : `切換到：${title}`}
                className="card flex h-full w-full cursor-pointer flex-col overflow-hidden text-center transition-transform duration-200 ease-out hover:scale-[1.03]"
              >
                <CardThumb screenshots={screenshots} title={title} />
                <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-5 py-4">
                  <h3 className="font-extrabold text-ink">{title}</h3>
                  <p className="text-sm leading-relaxed text-ink-3">{desc}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="上一張"
          className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-1.5">
          {HOME_EXTRA_FEATURES.map((item, i) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`第 ${i + 1} 張：${item.title}`}
              className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-brand' : 'w-1.5 bg-line'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="下一張"
          className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      </div>

      <Modal
        isOpen={!!openFeature}
        onClose={() => setOpenIndex(null)}
        title={openFeature?.title}
        maxWidth="max-w-2xl"
      >
        {openFeature && (
          <div className="p-5 pb-8">
            <DeviceShowcase screenshots={openFeature.screenshots} title={openFeature.title} />
          </div>
        )}
        <p className="px-5 pb-5 text-sm leading-relaxed text-ink-3">{openFeature?.desc}</p>
      </Modal>
    </section>
  )
}
