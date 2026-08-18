import { useLayoutEffect } from 'react'

let svhProbe = null
export function getStableViewportHeight() {
  if (typeof document === 'undefined') return 0
  if (!svhProbe) {
    svhProbe = document.createElement('div')
    svhProbe.style.cssText = 'position:fixed;top:0;left:0;height:100svh;width:0;visibility:hidden;pointer-events:none;z-index:-1;'
    document.body.appendChild(svhProbe)
  }
  return svhProbe.getBoundingClientRect().height
}

// 把 window.innerHeight 寫進一個 CSS 變數，只在「捲動真正結束」（scrollend）或「寬度
// 真的改變」（旋轉螢幕／真正調整視窗，用 innerWidth 比對，邏輯跟 RevealSection.jsx
// 判斷是否要重新量測縮放比例同一套）才更新，捲動或工具列動畫進行中一律不更新——
// 之前試過用 resize 事件 debounce 猜「使用者停手了」，但 iOS Safari 捲動中會連續
// 觸發 resize，debounce 計時器一直被重置，導致整段捲動高度都凍結在舊值，放開手指那
// 瞬間才一次補上正確高度，8 個 Section 疊在一起等於一次性大跳動，比原生 dvh 連續
// 小幅變化更明顯（已 revert，見 commit 53f3890／9655ef6）。scrollend 是瀏覽器原生
// 「捲動慣性真正停止」事件，不需要用時間去猜，理論上能避開這個問題；iOS Safari 17
// 以下不支援 scrollend，退化成只在 mount 跟真正 resize 時更新，不會比原本更差
export function useSettledViewportHeightVar(varName) {
  useLayoutEffect(() => {
    function apply() {
      document.documentElement.style.setProperty(varName, `${window.innerHeight}px`)
    }
    apply()

    let lastWidth = window.innerWidth
    function handleResize() {
      if (window.innerWidth === lastWidth) return
      lastWidth = window.innerWidth
      apply()
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scrollend', apply)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scrollend', apply)
      document.documentElement.style.removeProperty(varName)
    }
  }, [varName])
}
