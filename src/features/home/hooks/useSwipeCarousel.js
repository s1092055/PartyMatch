import { useRef } from 'react'

const SWIPE_THRESHOLD = 40

// 無限循環幻燈片共用的拖拽切換邏輯（滑鼠/觸控共用 Pointer Events）：只在放開時判斷
// 位移量是否超過門檻，沒超過門檻就當一般點擊處理（不攔截，讓卡片自己的 onClick
// 正常觸發切換焦點）；FeaturedGroupsCarousel（3D）與 WhyUs（平面）共用同一套判斷邏輯
export function useSwipeCarousel(count, setIndex) {
  const dragRef = useRef({ startX: 0, dragging: false })

  function onPointerDown(e) {
    dragRef.current = { startX: e.clientX, dragging: true }
  }

  function onPointerUp(e) {
    if (!dragRef.current.dragging || count < 2) return
    dragRef.current.dragging = false
    const deltaX = e.clientX - dragRef.current.startX
    if (deltaX > SWIPE_THRESHOLD) setIndex(i => (i - 1 + count) % count)
    else if (deltaX < -SWIPE_THRESHOLD) setIndex(i => (i + 1) % count)
  }

  return { onPointerDown, onPointerUp }
}

// 相對中心的最短偏移量，讓幻燈片可無限循環（例如 5 張卡片時，index 0 相對 index 4
// 的最短偏移量是 +1 而不是 -4）
export function resolveCarouselOffset(i, focusIndex, count) {
  let offset = i - focusIndex
  if (offset > count / 2) offset -= count
  if (offset < -count / 2) offset += count
  return offset
}
