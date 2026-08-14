import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useRevealSectionScale } from './RevealSectionScaleContext'

// iOS Safari 捲動時網址列會即時收合/展開，window.innerHeight 跟著即時變動——如果拿它當
// 「可用高度」的依據，每次網址列收合都會觸發 resize 事件、重新算出不同的縮放比例，畫面上
// 看起來就是捲動吸附還沒定位時內容一直在忽大忽小地縮放。CSS 的 100svh（small viewport
// height）是規格保證「假設網址列一直展開」算出來的最保守高度，不會隨網址列收合即時變動，
// 用一個看不見的探測元素量出它實際的像素值，取代 window.innerHeight 當穩定基準
let svhProbe = null
function getStableViewportHeight() {
  if (typeof document === 'undefined') return 0
  if (!svhProbe) {
    svhProbe = document.createElement('div')
    svhProbe.style.cssText = 'position:fixed;top:0;left:0;height:100svh;width:0;visibility:hidden;pointer-events:none;z-index:-1;'
    document.body.appendChild(svhProbe)
  }
  return svhProbe.getBoundingClientRect().height
}

export default function RevealSection({ children, delay = 0, className = '' }) {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [naturalHeight, setNaturalHeight] = useState(null)
  const [localScale, setLocalScale] = useState(1)
  const id = useId()
  const scaleCtx = useRevealSectionScale()
  // reportScale/unregister 下面的 useLayoutEffect 只依賴 id，不依賴 scaleCtx 物件本身——
  // Provider 給的 scaleCtx 只要 globalScale 一變就會是新物件參照，若直接放進依賴陣列，
  // 掛載時只要有任一個 RevealSection 回報非 1 的縮放值，就會讓全部 RevealSection 的這個
  // effect 一起 cleanup（unregister）又重新註冊一次，多跑好幾輪不必要的抖動。用 ref
  // 存最新的 scaleCtx，讓 effect 內部永遠讀得到最新值，但不會因為它變動而重新訂閱
  const scaleCtxRef = useRef(scaleCtx)
  useLayoutEffect(() => {
    scaleCtxRef.current = scaleCtx
  })

  useEffect(() => {
    const el = outerRef.current
    if (!el) return

    // 不再 unobserve：離開視窗時把 visible 收回 false，下次滾回來才會重新
    // 播放同一套 slide-up 動畫，而不是只有第一次進場才有效果
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 首頁每個 Section 都是 min-h-dvh + 內容置中，內容如果比一個視窗的可用高度還高（視窗
  // 較矮、或內容本身較長），需要等比縮小，避免撐爆 Section、把底部 ScrollCue「下滑查看
  // 更多」擠出可視範圍。這裡只算出「自己需要縮到多少」（localScale）回報給
  // RevealSectionScaleProvider，實際套用的縮放比例（見 render 那段的 appliedScale）是
  // 所有 Section 共用的全域最小值，確保整頁文字大小不會忽大忽小。
  // available 用 getStableViewportHeight()（近似 100svh）而不是 section.clientHeight，
  // 避免「縮小 → section 變矮 → available 變大 → 又放大」這種自我循環；也不能用
  // window.innerHeight，iOS Safari 捲動時網址列收合會讓它即時變動，見上面 svh 探測器的說明
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
      // 手機版 MobileDock 是蓋在畫面最上層的 fixed 元素，不會讓 100dvh 的高度縮水，
      // 但實際可視內容還是會被它擋住，這裡量它目前實際佔用的高度（含底部留白）。
      // 不能用 offsetParent 判斷是否顯示——position:fixed 的元素 offsetParent 永遠是
      // null（規格如此，不代表沒顯示），得看 computed display 才知道有沒有被 can-hover:lg:hidden 收掉。
      // dockReserve 直接從 Dock 自己的高度 + CSS bottom 位移算，不要用
      // 「window.innerHeight - dockEl.getBoundingClientRect().top」反推——後者混用了會隨
      // iOS 網址列收合即時變動的 window.innerHeight 跟穩定的 svh 基準，兩個參考座標系不一致
      const dockEl = document.querySelector('[data-mobile-dock]')
      const dockVisible = dockEl && getComputedStyle(dockEl).display !== 'none'
      const dockReserve = dockVisible
        ? dockEl.offsetHeight + parseFloat(getComputedStyle(dockEl).bottom || '0')
        : 0
      const available = getStableViewportHeight() - verticalPadding - dockReserve
      // 不設縮小下限：這個機制的目的就是讓內容無論如何都不要溢出、擋住下方的
      // ScrollCue／MobileDock，之前卡在 0.5（最多只縮到一半）在視窗矮到一定程度時
      // 反而會讓內容真的爆版溢出，違背這個機制本來的目的
      const required = available > 0 && natural > available ? available / natural : 1
      if (scaleCtxRef.current) {
        scaleCtxRef.current.reportScale(id, required)
      } else {
        setLocalScale(prev => (prev === required ? prev : required))
      }
    }

    recalc()
    const resizeObserver = new ResizeObserver(recalc)
    resizeObserver.observe(inner)
    window.addEventListener('resize', recalc)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', recalc)
      scaleCtxRef.current?.unregister(id)
    }
  }, [id])

  const appliedScale = scaleCtx ? scaleCtx.globalScale : localScale
  const height = appliedScale < 1 && naturalHeight != null ? naturalHeight * appliedScale : null

  return (
    <div ref={outerRef} className={className} style={{ height: height ?? undefined }}>
      {/* 縮放（appliedScale）跟進場動畫（opacity/translateY）分成兩層：縮放要跟著 RWD
          即時反應，不能有 transition，不然拖動視窗調整寬度時畫面會拖著尾巴慢半拍才跟上；
          進場的 slide-up 效果才需要 transition，兩者用途不同不能套同一個 transform */}
      <div ref={innerRef} style={{ transform: `scale(${appliedScale})`, transformOrigin: 'top center' }}>
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
