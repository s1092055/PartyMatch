import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const RevealSectionScaleContext = createContext(null)

const INCREASE_DEBOUNCE_MS = 400

export function RevealSectionScaleProvider({ children }) {
  const scalesRef = useRef(new Map())
  const increaseTimersRef = useRef(new Map())
  const [globalScale, setGlobalScale] = useState(1)

  function recomputeGlobalScale() {
    let min = 1
    scalesRef.current.forEach(scale => {
      if (scale < min) min = scale
    })
    setGlobalScale(prev => (prev === min ? prev : min))
  }

  const reportScale = useCallback((id, scale) => {
    const prev = scalesRef.current.get(id)
    const timers = increaseTimersRef.current
    clearTimeout(timers.get(id))
    timers.delete(id)

    if (prev === undefined || scale <= prev) {
      scalesRef.current.set(id, scale)
      recomputeGlobalScale()
      return
    }

    const timer = setTimeout(() => {
      timers.delete(id)
      scalesRef.current.set(id, scale)
      recomputeGlobalScale()
    }, INCREASE_DEBOUNCE_MS)
    timers.set(id, timer)
  }, [])

  const unregister = useCallback(id => {
    clearTimeout(increaseTimersRef.current.get(id))
    increaseTimersRef.current.delete(id)
    scalesRef.current.delete(id)
    recomputeGlobalScale()
  }, [])

  const value = useMemo(() => ({ reportScale, unregister, globalScale }), [reportScale, unregister, globalScale])

  return <RevealSectionScaleContext.Provider value={value}>{children}</RevealSectionScaleContext.Provider>
}

export function useRevealSectionScale() {
  return useContext(RevealSectionScaleContext)
}
