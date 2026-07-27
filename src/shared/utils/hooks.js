import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from './toast'

// 建立群組 Step2/Step3 左右兩欄版面只在「桌機寬度（對齊 index.css 的 lg: 1280px）+ 螢幕不高」時才並排，
// 螢幕夠高時改回跟手機/平板一樣的垂直排列，避免固定高度的兩欄容器在高螢幕下方留下大片空白
export const SHORT_LG_QUERY = '(min-width: 1280px) and (max-height: 899px)'

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = e => setMatches(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

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

// 由觸發滾輪事件的節點往上找，是否已經位在「本來就能自己垂直捲動」的祖先元素內
// （例如頁面裡獨立的側邊摘要面板）——如果是，交給該元素自己處理，不應該被轉發搶走
function hasScrollableAncestor(node, stopAt) {
  let cur = node
  while (cur && cur !== stopAt && cur !== document.body) {
    if (cur instanceof HTMLElement) {
      const style = getComputedStyle(cur)
      const canScrollY = (style.overflowY === 'auto' || style.overflowY === 'scroll') && cur.scrollHeight > cur.clientHeight
      if (canScrollY) return true
    }
    cur = cur.parentElement
  }
  return false
}

// 共用滾輪轉發：無論幾個元件訂閱，window 上只掛一個真正的 'wheel' listener（ref-count 釋放）
// Modal 開啟（scroll lock 中）時不轉發，避免滾動背景頁面而非 Modal 本身內容
const _wheelSubs = new Set()
function _notifyWheel(e) {
  if (_lockCount > 0) return
  _wheelSubs.forEach(fn => fn(e))
}
function subscribeWheel(fn) {
  _wheelSubs.add(fn)
  if (_wheelSubs.size === 1) window.addEventListener('wheel', _notifyWheel, { passive: true })
  return () => {
    _wheelSubs.delete(fn)
    if (_wheelSubs.size === 0) window.removeEventListener('wheel', _notifyWheel)
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
// forwardWheel：讓滑鼠在頁面任何位置（含固定 header／底部導覽列）滾動滾輪時，都轉發捲動量給內容容器，
// 屬於「整頁式流程」才需要的選配行為，預設關閉，避免非全頁情境的呼叫端被動繼承這個副作用
export function useScrollEdge({ withMutationObserver = false, forwardWheel = false } = {}) {
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

  useEffect(() => {
    if (!forwardWheel) return
    return subscribeWheel(e => {
      const el = elRef.current
      if (!el || el.contains(e.target) || el.scrollHeight <= el.clientHeight) return
      if (hasScrollableAncestor(e.target, document.body)) return
      el.scrollBy({ top: e.deltaY })
    })
  }, [forwardWheel])

  return { scrollRef, elRef, atBottom, canScroll, isScrolling, handleScroll }
}

// 共用點擊外部偵測：無論幾個元件訂閱，document 上只掛一個真正的 'pointerdown' listener（ref-count 釋放）
const _pointerDownSubs = new Set()
function _notifyPointerDown(e) {
  _pointerDownSubs.forEach(fn => fn(e))
}
function subscribePointerDown(fn) {
  _pointerDownSubs.add(fn)
  if (_pointerDownSubs.size === 1) document.addEventListener('pointerdown', _notifyPointerDown)
  return () => {
    _pointerDownSubs.delete(fn)
    if (_pointerDownSubs.size === 0) document.removeEventListener('pointerdown', _notifyPointerDown)
  }
}

// 倒數計時：回傳距離 deadline 的剩餘時間（格式化字串）跟是否已逾期，每秒重新計算一次
// 逾期不會觸發任何副作用，純粹給 UI 顯示用
export function useCountdown(deadline) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!deadline) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [deadline])

  if (!deadline) return { label: null, expired: false }

  const remainingMs = new Date(deadline).getTime() - now
  if (remainingMs <= 0) return { label: null, expired: true }

  const totalSeconds = Math.floor(remainingMs / 1000)
  const hours   = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = n => String(n).padStart(2, '0')
  const label = hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`

  return { label, expired: false }
}

// 附件上傳共用邏輯：申訴附件、團主回報帳號問題的附件都是同一套「選檔→上傳→存 url/name→
// 失敗跳 toast→清空重選」流程，差別只在呼叫哪支 upload API（uploadFn）
export function useEvidenceUpload(uploadFn) {
  const [url, setUrl]             = useState('')
  const [name, setName]           = useState('')
  const [uploading, setUploading] = useState(false)

  async function onSelect(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const uploadedUrl = await uploadFn(file)
      setUrl(uploadedUrl)
      setName(file.name)
    } catch (err) {
      toast(err?.message ?? '附件上傳失敗，請稍後再試', 'error')
    } finally {
      setUploading(false)
    }
  }

  function reset() {
    setUrl('')
    setName('')
  }

  return { url, name, uploading, onSelect, onRemove: reset, reset }
}

export function useClickOutside(enabled, refs, onClose) {
  const refsRef = useRef(refs)
  const onCloseRef = useRef(onClose)
  useEffect(() => { refsRef.current = refs; onCloseRef.current = onClose })

  useEffect(() => {
    if (!enabled) return
    return subscribePointerDown(e => {
      if (refsRef.current.every(ref => !ref.current?.contains(e.target))) onCloseRef.current()
    })
  }, [enabled])
}
