import { useEffect, useRef, useState } from 'react'

// 每次進入畫面都重播淡入效果：離開視窗時 visible 重設回 false，下次再捲入視窗時
// opacity/translateY transition 會重新播放一次，不是只在第一次看到時播放
export default function RevealSection({ children, delay = 0, className = '' }) {
  const outerRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = outerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
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
