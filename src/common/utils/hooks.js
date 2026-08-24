import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from './toast'
import { useAuthStore } from '../stores/useAuthStore'

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = e => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

let _lockCount = 0;

let _lockedScrollY = 0;

export function useScrollLock(enabled) {
  useEffect(() => {
    if (!enabled) return
    _lockCount++
    if (_lockCount === 1) {
      _lockedScrollY = window.scrollY
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.documentElement.style.setProperty('--scrollbar-compensation', `${scrollbarWidth}px`)
      document.body.style.position = 'fixed'
      document.body.style.top = `-${_lockedScrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    return () => {
      _lockCount--
      if (_lockCount === 0) {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.paddingRight = ''
        document.documentElement.style.setProperty('--scrollbar-compensation', '0px')
        window.scrollTo(0, _lockedScrollY)
      }
    }
  }, [enabled])
}

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

const _wheelSubs = new Set();
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

const _pointerDownSubs = new Set();
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

export function useConfirmCountdown(seconds) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = setTimeout(() => setRemaining(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining])

  return { remaining, ready: remaining <= 0 }
}

const EVIDENCE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/heic'];
const EVIDENCE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function useEvidenceUpload(uploadFn) {
  const [key, setKey]             = useState('')
  const [url, setUrl]             = useState('')
  const [name, setName]           = useState('')
  const [uploading, setUploading] = useState(false)

  async function onSelect(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!EVIDENCE_MIME_TYPES.includes(file.type)) {
      toast('僅支援圖片格式（PNG／JPG／GIF／WEBP／HEIC）', 'error')
      return
    }
    if (file.size > EVIDENCE_MAX_SIZE_BYTES) {
      toast('附件檔案大小不能超過 5MB', 'error')
      return
    }
    setUploading(true)
    try {
      const uploaded = await uploadFn(file)
      setKey(uploaded.key)
      setUrl(uploaded.url)
      setName(file.name)
    } catch (err) {
      toast(err?.message ?? '附件上傳失敗，請稍後再試', 'error')
    } finally {
      setUploading(false)
    }
  }

  function reset() {
    setKey('')
    setUrl('')
    setName('')
  }

  return { key, url, name, uploading, onSelect, onRemove: reset, reset }
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

export function useLogout() {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const logout = useCallback(async () => {
    setLoggingOut(true)
    await useAuthStore.getState().logout()
    navigate('/login', { replace: true })
  }, [navigate])

  return { loggingOut, logout }
}
