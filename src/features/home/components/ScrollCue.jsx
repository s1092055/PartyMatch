import { useEffect, useRef, useState } from 'react'
import { ChevronsDown } from 'lucide-react'

const IDLE_DELAY = 2000

// 首頁「下滑查看更多」視覺提示，純裝飾用（不可點擊、不會捲動頁面）。只掛在 HomePage 一份、
// fixed 定位貼在視窗底部，不再是每個 Section 各自 absolute 一份——因為每個 Section 都是
// min-h-dvh（剛好一個視窗高），fixed 相對視窗的位置跟原本 absolute 相對各自 Section 的
// 位置視覺上完全一樣，但不用再逐一插入到每個 Section 裡面。bottom-24／bottom-4 這組
// 斷點要跟 MobileDock 的顯示條件（lg:hidden，純看寬度，不疊 can-hover:）對齊，不能用
// can-hover:lg:——lg 以上寬度不管有沒有 hover 能力，MobileDock 都已經隱藏了（iPad 版
// 改用 TabletSidebarDrawer），這裡還留著 can-hover: 的話，iPad 橫向會被誤判成「還要
// 避開 MobileDock」，多留一截不必要的下緣距離，反而把提示往上推到跟內容重疊的位置。
// 手機版避開 MobileDock（約佔 76px 高）用 bottom-24；lg 以上（含 iPad）沒有 MobileDock
// 要避開，貼近底部用 bottom-4，對齊 DesktopSidebar（fixed bottom-4）的底部邊緣。
// 頁面沒有捲動超過 2 秒才淡入顯示，一偵測到捲動（含滑鼠
// 滾輪／觸控滑動）就立刻淡出並重新倒數，避免一直佔著畫面；捲到最後一個 Section（常見
// 問題，底下只剩 Footer）時直接隱藏，不需要再提示「下滑查看更多」。水平置中不能只用單純
// 的 left-1/2，要跟 HomePage.jsx 那層 can-hover:lg:ml-20／can-hover:lg:mr-24 的版面
// 留白疊同一套 class——桌機有 DesktopSidebar 佔掉左邊、SectionNav 佔掉右邊，可視內容
// 區域本身就不是整個視窗置中，用 inset-x-0 + 同樣的 ml/mr + flex justify-center，才會
// 真的對齊可視內容的水平中心，不是對齊整個螢幕（含側邊欄/選單佔用的部分）的中心
export default function ScrollCue() {
  const [idle, setIdle] = useState(false)
  const [nearEnd, setNearEnd] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    function resetTimer() {
      setIdle(false)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setIdle(true), IDLE_DELAY)
    }

    resetTimer()
    const events = ['scroll', 'wheel', 'touchmove']
    events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }))
    return () => {
      clearTimeout(timerRef.current)
      events.forEach(event => window.removeEventListener(event, resetTimer))
    }
  }, [])

  useEffect(() => {
    const lastSection = document.getElementById('section-faq')
    if (!lastSection) return
    const observer = new IntersectionObserver(([entry]) => setNearEnd(entry.isIntersecting))
    observer.observe(lastSection)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center transition-opacity duration-500 lg:bottom-4 can-hover:lg:ml-20 can-hover:lg:mr-24 ${
        idle && !nearEnd ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-bold text-ink-2">
        <ChevronsDown size={16} strokeWidth={1.5} />
        下滑查看更多
        <ChevronsDown size={16} strokeWidth={1.5} />
      </span>
    </div>
  )
}
