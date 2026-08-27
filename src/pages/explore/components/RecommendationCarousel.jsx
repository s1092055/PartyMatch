import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import RecommendationCard from './RecommendationCard'

export default function RecommendationCarousel({ groups }) {
  const [currentIndex, setCurrentIndex]   = useState(0)
  const [visibleCount, setVisibleCount]   = useState(3)
  const [isPaused, setIsPaused]           = useState(false)
  const intervalRef                        = useRef(null)
  const touchStartX                        = useRef(null)
  const touchStartY                        = useRef(null)
  const isDragging                         = useRef(false)
  const trackRef                           = useRef(null)

  useEffect(() => {
    function update() {
      if (window.innerWidth < 768)       setVisibleCount(1)
      else if (window.innerWidth < 1280) setVisibleCount(2)
      else                               setVisibleCount(3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const maxIndex = useMemo(
    () => Math.max(0, groups.length - visibleCount),
    [groups.length, visibleCount],
  )

  const next = useCallback(
    () => setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1)),
    [maxIndex],
  )

  const prev = useCallback(
    () => setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1)),
    [maxIndex],
  )

  useEffect(() => {
    setTimeout(() => setCurrentIndex(prev => Math.min(prev, maxIndex)), 0)
  }, [maxIndex])

  useEffect(() => {
    if (isPaused) return
    intervalRef.current = setInterval(next, 3500)
    return () => clearInterval(intervalRef.current)
  }, [isPaused, next])

  const cardWidth = 100 / visibleCount

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    function onTouchStart(e) {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      isDragging.current = false
      setIsPaused(true)
    }

    function onTouchMove(e) {
      if (touchStartX.current === null) return
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
      if (dx > dy && dx > 8) {
        isDragging.current = true
        e.preventDefault()
      }
    }

    function onTouchEnd(e) {
      if (touchStartX.current === null) return
      const dx = e.changedTouches[0].clientX - touchStartX.current
      if (isDragging.current) {
        if (dx < -40) next()
        else if (dx > 40) prev()
      }
      touchStartX.current = null
      touchStartY.current = null
      isDragging.current = false
      setIsPaused(false)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [next, prev])

  return (
    <div
      ref={trackRef}
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden pt-4 -mt-4 pb-10 -mb-10">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * cardWidth}%)` }}
        >
          {groups.map(group => (
            <div
              key={group.id}
              className="flex-shrink-0 px-2 md:px-3"
              style={{ width: `${cardWidth}%` }}
            >
              <RecommendationCard group={group} />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={prev}
        className="absolute -left-4 top-[calc(50%-1.25rem)] z-10 grid h-9 w-9 place-items-center rounded-full border border-line bg-white shadow-md text-ink-3 transition-colors hover:bg-raised hover:text-ink"
        aria-label="上一個"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="absolute -right-4 top-[calc(50%-1.25rem)] z-10 grid h-9 w-9 place-items-center rounded-full border border-line bg-white shadow-md text-ink-3 transition-colors hover:bg-raised hover:text-ink"
        aria-label="下一個"
      >
        <ChevronRight size={18} />
      </button>

      <div className="mt-8 flex justify-center gap-1.5">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'w-6 bg-brand' : 'w-1.5 bg-line'
            }`}
            aria-label={`第 ${i + 1} 頁`}
          />
        ))}
      </div>
    </div>
  )
}
