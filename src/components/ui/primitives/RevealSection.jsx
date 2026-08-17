import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useRevealSectionScale } from './RevealSectionScaleContext'
import { getStableViewportHeight, getMobileDockReserve } from '../../../common/utils/viewport'

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

    // 一般頁面（Explore／ManageGroups 等連續捲動）不 unobserve：離開視窗時把 visible
    // 收回 false，下次滾回來才會重新播放同一套 slide-up 動畫。但首頁的 Section 是
    // scroll-snap-mandatory，捲動時視窗會瞬間吸附到下一個 Section 的最終位置，之後
    // 才播放淡入/位移動畫——如果也跟其他頁面一樣「離開視窗就重置」，從下面的 Section
    // 往上滑回已經看過的 Section 時，畫面早就吸附到位、內容卻還要重新滑入淡出，看起來
    // 像版面跑位、RWD 沒套用好。用 scaleCtx 是否存在判斷是不是首頁（只有首頁會包一層
    // RevealSectionScaleProvider），是的話只播放一次（進場動畫本來就是給第一次出現的
    // 內容用），其他頁面維持原本「重新捲回來會重播」的效果
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (scaleCtxRef.current) observer.unobserve(el)
        } else if (!scaleCtxRef.current) {
          setVisible(false)
        }
      },
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
      const available = getStableViewportHeight() - verticalPadding - getMobileDockReserve()
      // 不設縮小下限：這個機制的目的就是保證每個 Section 一定剛好等於一個畫面高度、絕對
      // 不會比畫面高。曾經加過下限（縮太多字會不可讀），但只要視窗矮到連下限都塞不下，
      // Section 就會比一個畫面還高——這時因為 <html> 同時開著 scroll-snap，捲過這段「超出
      // 畫面的部分」看起來會像是這個 Section 自己有一段內部捲動，跟其他 Section 的行為不
      // 一致，比文字縮小的問題更嚴重，所以拿掉下限，保留「一定塞進一個畫面」這個更重要的
      // 保證
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
