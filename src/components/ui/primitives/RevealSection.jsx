import { useEffect, useRef, useState } from 'react'

// 只觸發一次淡入，觸發後立刻 unobserve：捲動途中如果 visible 被設回 false，會讓已經看過
// 的內容重新播放一次 opacity/translateY transition，使用者會在捲動途中看到內容突然「跳」一下
export default function RevealSection({ children, delay = 0, className = '' }) {
  const outerRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = outerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
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
