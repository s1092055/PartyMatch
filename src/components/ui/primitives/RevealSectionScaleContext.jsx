import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const RevealSectionScaleContext = createContext(null)

// 讓同一個 Provider 底下所有 RevealSection 共用「同一個」縮放比例，而不是各自根據自己的
// 內容高度獨立縮放——不然某個內容較長的 Section 縮小了、旁邊內容較短的 Section 卻維持
// 原尺寸，切換 Section 時文字大小忽大忽小會很不協調。做法：每個 RevealSection 只回報
// 「自己如果要塞進一個視窗，最多可以縮到多少」，這裡統一取全部回報值裡最小的（最保守、
// 縮最多的那個），再讓所有 RevealSection 都套用這同一個全域縮放比例
export function RevealSectionScaleProvider({ children }) {
  const scalesRef = useRef(new Map())
  const [globalScale, setGlobalScale] = useState(1)

  function recomputeGlobalScale() {
    let min = 1
    scalesRef.current.forEach(scale => {
      if (scale < min) min = scale
    })
    setGlobalScale(prev => (prev === min ? prev : min))
  }

  const reportScale = useCallback((id, scale) => {
    scalesRef.current.set(id, scale)
    recomputeGlobalScale()
  }, [])

  const unregister = useCallback(id => {
    scalesRef.current.delete(id)
    recomputeGlobalScale()
  }, [])

  const value = useMemo(() => ({ reportScale, unregister, globalScale }), [reportScale, unregister, globalScale])

  return <RevealSectionScaleContext.Provider value={value}>{children}</RevealSectionScaleContext.Provider>
}

// 沒有 Provider 時回傳 null，RevealSection 自己判斷 fallback 成只針對自己縮放（例如
// ExplorePage／ManageGroupsPage 那種清單卡片用法，本來就不需要跨 Section 同步縮放）
export function useRevealSectionScale() {
  return useContext(RevealSectionScaleContext)
}
