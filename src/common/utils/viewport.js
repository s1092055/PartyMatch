import { useLayoutEffect } from 'react'

// 把 window.innerHeight 寫進一個 CSS 變數，只在「捲動真正結束」（scrollend）或「寬度
// 真的改變」（旋轉螢幕／真正調整視窗，用 innerWidth 比對）才更新，捲動或工具列動畫進行中
// 一律不更新——首頁只有 Hero 這一節維持滿版高度（見 HomePage.jsx），如果直接用原生
// `dvh`，iPhone Safari 工具列收合展開過程中會連續變化，Hero 高度跟著連續重新排版，
// 拖著下面所有 Section 的位置一起抖動。之前試過用 `resize` 事件 debounce 猜「使用者
// 停手了」，但 iOS Safari 捲動中會連續觸發 `resize`，debounce 計時器一直被重置，導致
// 整段捲動高度都凍結在舊值，放開手指那瞬間才一次補上正確高度，反而比原生 dvh 連續小幅
// 變化更明顯（已 revert，見 commit 53f3890／9655ef6）。`scrollend` 是瀏覽器原生「捲動
// 慣性真正停止」事件，不需要用時間去猜，已實機確認能避開這個問題（見 CLAUDE.md）
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
