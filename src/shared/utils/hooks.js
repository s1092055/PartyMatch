import { useEffect } from 'react'

export function useScrollLock(enabled) {
  useEffect(() => {
    if (!enabled) return
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.documentElement.style.overflowY = 'hidden'
    document.documentElement.style.paddingRight = `${scrollbarWidth}px`
    return () => {
      document.documentElement.style.overflowY = ''
      document.documentElement.style.paddingRight = ''
    }
  }, [enabled])
}

export function useClickOutside(enabled, refs, onClose) {
  useEffect(() => {
    if (!enabled) return
    function handleMouseDown(e) {
      if (refs.every(ref => !ref.current?.contains(e.target))) onClose()
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [enabled])
}
