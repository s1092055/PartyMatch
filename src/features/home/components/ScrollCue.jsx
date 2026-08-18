import { useEffect, useRef, useState } from 'react'
import { ChevronsDown } from 'lucide-react'

const IDLE_DELAY = 2000

// 首頁「下滑查看更多」視覺提示，純裝飾用（不可點擊、不會捲動頁面）。只掛在 HomePage 一份、
// fixed 定位貼在視窗底部，不需要逐一插入到每個 Section 裡面。手機版導覽已經改成跟 iPad
// 共用 TabletSidebarDrawer（觸發鈕在左上角）＋ DesktopSidebar 的浮動按鈕（bottom-right），
// 底部中央不再有 MobileDock 這種橫跨全寬的固定元素要避開，貼近底部一律用 bottom-4，
// 對齊 DesktopSidebar（fixed bottom-4）的底部邊緣。
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
      className={`pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center transition-opacity duration-500 can-hover:lg:ml-20 can-hover:lg:mr-24 ${
        idle && !nearEnd ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="flex items-center gap-2 rounded-full bg-neutral-900/80 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
        <ChevronsDown size={16} strokeWidth={1.5} />
        下滑查看更多
        <ChevronsDown size={16} strokeWidth={1.5} />
      </span>
    </div>
  )
}
