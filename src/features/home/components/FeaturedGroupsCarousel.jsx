import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Search } from 'lucide-react'
import { useGroupStore } from '../../../common/stores/useGroupStore'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { Button } from '../../../components/ui/button'
import ExploreGroupCard from '../../explore/components/ExploreGroupCard'

// 精選幾個「快額滿」（剩餘名額比例低）或「熱門」（已加入人數多）的招募中群組，
// 不是把探索頁全部群組都塞進來
function selectFeaturedGroups(groups, excludeHostId, limit = 8) {
  const recruiting = groups.filter(g => g.status === 'recruiting' && g.openSeats > 0 && g.hostId !== excludeHostId)
  return [...recruiting]
    .sort((a, b) => {
      const filledA = (a.maxMembers ?? 0) - (a.openSeats ?? 0)
      const filledB = (b.maxMembers ?? 0) - (b.openSeats ?? 0)
      const ratioA = a.maxMembers ? filledA / a.maxMembers : 0
      const ratioB = b.maxMembers ? filledB / b.maxMembers : 0
      if (ratioB !== ratioA) return ratioB - ratioA
      return filledB - filledA
    })
    .slice(0, limit)
}

// 帶 3D coverflow 效果的群組卡幻燈片：中央卡片全清晰置中，左右兩側卡片縮小、模糊、
// 用 rotateY 做立體透視，可無限循環（用 modulo 算出相對中心的最短偏移量），
// 點擊側邊卡片或左右箭頭都能切換焦點
export default function FeaturedGroupsCarousel() {
  const navigate = useNavigate()
  const groups = useGroupStore(s => s.groups)
  const activeUserId = useAuthStore(s => s.user?.id)
  const [focusIndex, setFocusIndex] = useState(0)
  const dragRef = useRef({ startX: 0, dragging: false })

  const featured = useMemo(() => selectFeaturedGroups(groups, activeUserId), [groups, activeUserId])
  const count = featured.length
  // 卡片數很少時（例如只有 2、3 張）縮小可視深度，避免同一張卡在左右兩側各出現一次
  const depth = Math.min(2, Math.floor((count - 1) / 2))

  // 手機版沒有左右箭頭，改用拖拽切換：只在放開時判斷位移量是否超過門檻，
  // 沒超過門檻就當一般點擊處理（不攔截，讓側邊卡片自己的 onClick 正常觸發切換焦點）
  function handlePointerDown(e) {
    dragRef.current = { startX: e.clientX, dragging: true }
  }
  function handlePointerUp(e) {
    if (!dragRef.current.dragging || count < 2) return
    dragRef.current.dragging = false
    const deltaX = e.clientX - dragRef.current.startX
    const threshold = 40
    if (deltaX > threshold) setFocusIndex(i => (i - 1 + count) % count)
    else if (deltaX < -threshold) setFocusIndex(i => (i + 1) % count)
  }

  if (count === 0) return null

  return (
    <div>
      <div className="flex flex-col items-center text-center">
        <h2 className="text-3xl font-extrabold text-ink">探索適合你的共享群組</h2>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-ink-3">
          依照需求搜尋、篩選條件，快速找到適合的群組。
        </p>
      </div>

      <div className="relative mt-4 overflow-x-clip sm:mt-10">
        <div
          className="relative h-[420px] touch-pan-y select-none [perspective:1400px]"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          {featured.map((g, i) => {
            let offset = i - focusIndex
            if (offset > count / 2) offset -= count
            if (offset < -count / 2) offset += count
            const abs = Math.abs(offset)
            if (abs > depth) return null

            const isFocused = offset === 0
            const scale = 1 - abs * 0.16
            const rotateY = offset * -22
            const translateX = offset * 58
            const blurPx = isFocused ? 0 : abs * 1.5
            const opacity = isFocused ? 1 : abs === 1 ? 0.75 : 0.4

            return (
              <div
                key={g.id}
                onClick={!isFocused ? () => setFocusIndex(i) : undefined}
                className={`absolute left-1/2 top-1/2 w-60 transition-all duration-500 ease-out sm:w-72 ${!isFocused ? 'cursor-pointer' : ''}`}
                style={{
                  transform: `translate(-50%, -50%) translateX(${translateX}%) rotateY(${rotateY}deg) scale(${scale})`,
                  filter: blurPx ? `blur(${blurPx}px)` : 'none',
                  opacity,
                  zIndex: 10 - abs,
                }}
              >
                <div className={!isFocused ? 'pointer-events-none' : ''}>
                  <ExploreGroupCard group={g} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-4 sm:mt-10">
        <Button size="lg" className="rounded-full px-8" onClick={() => navigate('/explore')}>
          <Compass size={16} strokeWidth={1.5} />
          探索群組
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="rounded-full px-8"
          onClick={() => window.dispatchEvent(new CustomEvent('pm:open-quick-match'))}
        >
          <Search size={16} strokeWidth={1.5} />
          快速搜尋
        </Button>
      </div>
    </div>
  )
}
