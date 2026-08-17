import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getStableViewportHeight, getMobileHeaderReserve, getMobileDockReserve } from '../../../common/utils/viewport'

export default function RevealSection({ children, delay = 0, className = '' }) {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [naturalHeight, setNaturalHeight] = useState(null)
  const [scale, setScale] = useState(1)

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

  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return
    const section = outer.closest('section')

    function recalc() {
      const natural = inner.scrollHeight
      setNaturalHeight(prev => (prev === natural ? prev : natural))

      if (!section) return
      const style = getComputedStyle(section)
      const verticalPadding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
      const available = getStableViewportHeight() - verticalPadding - getMobileHeaderReserve() - getMobileDockReserve()
      const required = available > 0 && natural > available ? available / natural : 1
      setScale(prev => (prev === required ? prev : required))
    }

    recalc()
    const resizeObserver = new ResizeObserver(recalc)
    resizeObserver.observe(inner)
    window.addEventListener('resize', recalc)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', recalc)
    }
  }, [])

  const height = scale < 1 && naturalHeight != null ? naturalHeight * scale : null

  return (
    <div ref={outerRef} className={className} style={{ height: height ?? undefined }}>
      <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
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
    </div>
  )
}
