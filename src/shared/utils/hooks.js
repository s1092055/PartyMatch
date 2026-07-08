import { useEffect, useRef, useState } from 'react'

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

// 往下捲動時隱藏、往上捲動或接近頁面頂端時顯示（用於行動版底部 Dock）
export function useHideOnScroll() {
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY
    function onScroll() {
      const y = window.scrollY
      const delta = y - lastY.current
      if (y < 50 || delta < -4) setVisible(true)
      else if (delta > 4) setVisible(false)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return visible
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
