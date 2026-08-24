import { useRef } from 'react'

const SWIPE_THRESHOLD = 40

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

export function resolveCarouselOffset(i, focusIndex, count) {
  let offset = i - focusIndex
  if (offset > count / 2) offset -= count
  if (offset < -count / 2) offset += count
  return offset
}
