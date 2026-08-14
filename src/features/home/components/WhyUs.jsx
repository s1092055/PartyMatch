import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { HOME_WHY_US } from '../data/homeContent'

// 平面（非 3D）幻燈片：中央卡片正常大小，左右各露出一張縮小/半透明的卡片當作提示，
// 用 modulo 算相對中心的最短偏移量做到可無限循環；拖拽（滑鼠/觸控共用 Pointer Events）
// 跟左右箭頭都能切換，箭頭只在有 hover 能力的裝置顯示，觸控裝置靠拖拽即可
function WhyUsCarousel({ items }) {
  const [index, setIndex] = useState(0)
  const dragRef = useRef({ startX: 0, dragging: false })
  const count = items.length

  function go(delta) {
    setIndex(i => (i + delta + count) % count)
  }

  function handlePointerDown(e) {
    dragRef.current = { startX: e.clientX, dragging: true }
  }
  function handlePointerUp(e) {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    const deltaX = e.clientX - dragRef.current.startX
    const threshold = 40
    if (deltaX > threshold) go(-1)
    else if (deltaX < -threshold) go(1)
  }

  return (
    <div
      className="relative isolate h-[28rem] touch-pan-y select-none overflow-x-clip"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {items.map(({ icon: Icon, image, title, desc }, i) => {
        let offset = i - index
        if (offset > count / 2) offset -= count
        if (offset < -count / 2) offset += count
        const abs = Math.abs(offset)
        if (abs > 1) return null

        const isFocused = offset === 0

        return (
          <div
            key={title}
            onClick={!isFocused ? () => setIndex(i) : undefined}
            className={`absolute left-1/2 top-1/2 w-64 transition-all duration-500 ease-out sm:w-72 ${!isFocused ? 'cursor-pointer' : ''}`}
            style={{
              transform: `translate(-50%, -50%) translateX(${offset * 68}%) scale(${isFocused ? 1 : 0.88})`,
              opacity: isFocused ? 1 : 0.45,
              zIndex: isFocused ? 10 : 5,
            }}
          >
            <div className={!isFocused ? 'pointer-events-none' : ''}>
              <Card className={`flex w-full flex-col items-center overflow-hidden text-center shadow-none ${image ? 'gap-3' : 'gap-3 p-7'}`}>
                {image ? (
                  <img src={image} alt="" className="h-72 w-full object-cover" />
                ) : (
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-subtle text-brand">
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                )}
                <div className={image ? 'px-7 pb-7' : ''}>
                  <p className="font-extrabold text-ink">{title}</p>
                  <p className="mt-1 whitespace-nowrap text-sm text-ink-3">{desc}</p>
                </div>
              </Card>
            </div>
          </div>
        )
      })}

      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="上一則"
        className="absolute left-0 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-canvas text-ink-3 shadow-md transition-colors hover:bg-raised hover:text-ink can-hover:grid"
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="下一則"
        className="absolute right-0 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-canvas text-ink-3 shadow-md transition-colors hover:bg-raised hover:text-ink can-hover:grid"
      >
        <ChevronRight size={16} strokeWidth={1.5} />
      </button>
    </div>
  )
}

// 「為什麼選擇 PartyMatch？」區塊
export default function WhyUs() {
  const navigate = useNavigate()
  const loggedIn = useAuthStore(s => s.loggedIn)

  return (
    <section className="text-center">
      <h2 className="text-3xl font-extrabold text-ink">為什麼選擇 PartyMatch？</h2>
      <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-ink-3">
        打造安全又完善機制，安心共享每一次的訂閱體驗。
      </p>

      <WhyUsCarousel items={HOME_WHY_US} />

      {!loggedIn && (
        <Button size="lg" className="rounded-full px-8" onClick={() => navigate('/login')}>
          登入會員了解更多
          <ChevronRight size={14} strokeWidth={1.5} />
        </Button>
      )}
    </section>
  )
}
