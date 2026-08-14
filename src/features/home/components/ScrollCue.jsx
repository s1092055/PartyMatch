import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

const IDLE_DELAY = 2000

// 跟 Hero 底部同一套「下滑查看更多」視覺提示，純裝飾用（不可點擊、不會捲動頁面），
// 手機版避開 MobileDock（約佔 76px 高）用 bottom-24；桌機／可 hover 裝置用 bottom-4，
// 對齊 DesktopSidebar（fixed bottom-4）的底部邊緣。頁面沒有捲動超過 2 秒才淡入顯示，
// 一偵測到捲動（含滑鼠滾輪／觸控滑動）就立刻淡出並重新倒數，避免一直佔著畫面
export default function ScrollCue() {
  const [idle, setIdle] = useState(false)
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

  return (
    <span
      className={`pointer-events-none absolute bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-sm font-bold text-ink-2 transition-opacity duration-500 can-hover:lg:bottom-4 ${
        idle ? 'opacity-100' : 'opacity-0'
      }`}
    >
      下滑查看更多
      <ChevronDown size={16} strokeWidth={1.5} />
    </span>
  )
}
