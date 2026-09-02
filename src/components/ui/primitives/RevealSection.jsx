import { useEffect, useRef, useState } from 'react'

export default function RevealSection({ children, delay = 0, className = '' }) {
  const outerRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = outerRef.current
    if (!el) return

    // 整頁重新載入時，一開始就在可視範圍內的卡片（例如捲動位置在最上方）
    // 會在瀏覽器還沒真的畫出 opacity:0 那一格畫面之前，IntersectionObserver
    // 就已經回報 isIntersecting=true，導致 0→1 的淡入沒有「起點」可以轉場，
    // 動畫等於沒播放到；延後一個 frame 再開始觀察，確保先畫出隱藏狀態那一格
    let observer
    const raf = requestAnimationFrame(() => {
      observer = new IntersectionObserver(
        ([entry]) => setVisible(entry.isIntersecting),
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      )
      observer.observe(el)
    })
    return () => {
      cancelAnimationFrame(raf)
      observer?.disconnect()
    }
  }, [])

  return (
    <div ref={outerRef} className={className}>
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: `translateY(${visible ? 0 : 20}px)`,
          transition: `opacity 0.75s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}ms, transform 0.75s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}ms`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
