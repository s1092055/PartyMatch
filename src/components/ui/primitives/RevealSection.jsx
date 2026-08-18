import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getStableViewportHeight, getMobileHeaderReserve, getMobileDockReserve } from '../../../common/utils/viewport'

export default function RevealSection({ children, delay = 0, className = '' }) {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [naturalHeight, setNaturalHeight] = useState(null)
  const [scale, setScale] = useState(1)

  // 只觸發一次淡入，觸發後立刻 unobserve：iPhone Safari 下方工具列在捲動中收合/展開時，
  // 每個 Section 的 min-h-dvh 高度會跟著即時變化，連帶讓前後 Section 的實際位置跟著挪動，
  // 使 IntersectionObserver 算出的交集比例在 threshold 附近來回跳動。如果 visible 會被設回
  // false，就會讓已經看過的內容重新播放一次 opacity/translateY transition，使用者會在捲動
  // 途中看到內容突然「跳」一下（就是這個奇怪的 transform 效果的來源）。改成只播放一次就不再
  // 監聽，工具列收合造成的交集比例抖動就不會再有機會觸發第二次動畫
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

    // iOS Safari 工具列收合/展開的過程中會連續觸發多次 window resize 事件（同一個工具列
    // 動畫可能對到好幾個 resize），每次 recalc 都要做 getComputedStyle／scrollHeight 這類
    // 強制同步 layout 的量測，8 個 Section 同時掛這個 listener 疊加起來就是明顯的捲動卡頓。
    // 用 requestAnimationFrame 把同一畫面內的多次觸發合併成一次量測，數值算出來通常沒變
    // （已有下面的 prev === 判斷擋掉不必要的 re-render），但省下重複量測本身的成本
    let frame = null
    function scheduleRecalc() {
      if (frame != null) return
      frame = requestAnimationFrame(() => {
        frame = null
        recalc()
      })
    }

    recalc()
    const resizeObserver = new ResizeObserver(scheduleRecalc)
    resizeObserver.observe(inner)
    window.addEventListener('resize', scheduleRecalc)
    return () => {
      if (frame != null) cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', scheduleRecalc)
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
