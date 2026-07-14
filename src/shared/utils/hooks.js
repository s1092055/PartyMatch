import { useCallback, useEffect, useRef, useState } from 'react'

// Reference counter so nested modals don't re-measure or prematurely release the lock.
let _lockCount = 0

export function useScrollLock(enabled) {
  useEffect(() => {
    if (!enabled) return
    _lockCount++
    if (_lockCount === 1) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.documentElement.style.overflowY = 'hidden'
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`
      document.documentElement.style.setProperty('--scrollbar-compensation', `${scrollbarWidth}px`)
    }
    return () => {
      _lockCount--
      if (_lockCount === 0) {
        document.documentElement.style.overflowY = ''
        document.documentElement.style.paddingRight = ''
        document.documentElement.style.setProperty('--scrollbar-compensation', '0px')
      }
    }
  }, [enabled])
}

// 共用捲動監聽：無論幾個元件訂閱，window 上只掛一個真正的 'scroll' listener（ref-count 釋放）
const _scrollSubs = new Set()
function _notifyScroll() {
  const y = window.scrollY
  _scrollSubs.forEach(fn => fn(y))
}
function subscribeScroll(fn) {
  _scrollSubs.add(fn)
  if (_scrollSubs.size === 1) window.addEventListener('scroll', _notifyScroll, { passive: true })
  return () => {
    _scrollSubs.delete(fn)
    if (_scrollSubs.size === 0) window.removeEventListener('scroll', _notifyScroll)
  }
}

export function useScrollY() {
  const [y, setY] = useState(() => window.scrollY)
  useEffect(() => subscribeScroll(setY), [])
  return y
}

// 往下捲動時隱藏、往上捲動或接近頁面頂端時顯示（用於行動版底部 Dock 等固定元素）
export function useHideOnScroll() {
  const [visible, setVisible] = useState(true)
  const lastY = useRef(window.scrollY)

  useEffect(() => subscribeScroll(y => {
    const delta = y - lastY.current
    if (y < 50 || delta < -4) setVisible(true)
    else if (delta > 4) setVisible(false)
    lastY.current = y
  }), [])

  return visible
}

// 捲動邊界偵測：回報是否可捲動、是否已到底部，並提供捲到頂/往下捲的控制函式
// （多個翻頁式流程頁面與步驟卡片共用同一套邏輯，避免各自重複實作 ResizeObserver 監聽）
export function useScrollEdge({ withMutationObserver = false } = {}) {
  const [atBottom, setAtBottom] = useState(false)
  const [canScroll, setCanScroll] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const elRef = useRef(null)
  const resizeObserverRef = useRef(null)
  const mutationObserverRef = useRef(null)
  const scrollIdleTimerRef = useRef(null)

  function updateScrollState(el) {
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    setAtBottom(scrollTop + clientHeight >= scrollHeight - 20)
    setCanScroll(scrollHeight > clientHeight + 20)
  }
  function handleScroll(e) {
    updateScrollState(e.currentTarget)
    setIsScrolling(true)
    clearTimeout(scrollIdleTimerRef.current)
    scrollIdleTimerRef.current = setTimeout(() => setIsScrolling(false), 200)
  }
  const scrollRef = useCallback((el) => {
    elRef.current = el
    resizeObserverRef.current?.disconnect()
    mutationObserverRef.current?.disconnect()
    if (!el) return
    const check = () => updateScrollState(el)
    const observer = new ResizeObserver(check)
    observer.observe(el)
    resizeObserverRef.current = observer
    if (withMutationObserver) {
      const mutationObserver = new MutationObserver(check)
      mutationObserver.observe(el, { childList: true, subtree: true })
      mutationObserverRef.current = mutationObserver
    }
    updateScrollState(el)
  }, [withMutationObserver])

  useEffect(() => () => clearTimeout(scrollIdleTimerRef.current), [])

  return { scrollRef, elRef, atBottom, canScroll, isScrolling, handleScroll }
}

export function useClickOutside(enabled, refs, onClose) {
  const refsRef = useRef(refs)
  const onCloseRef = useRef(onClose)

  useEffect(() => { refsRef.current = refs; onCloseRef.current = onClose })

  useEffect(() => {
    if (!enabled) return
    function handlePointerDown(e) {
      if (refsRef.current.every(ref => !ref.current?.contains(e.target))) onCloseRef.current()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [enabled])
}
