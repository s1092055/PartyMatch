import { useEffect } from 'react'

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
