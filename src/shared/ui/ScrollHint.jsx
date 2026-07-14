import { ChevronDown, ChevronUp } from 'lucide-react'

// 捲動提示：內容可捲動時顯示，捲到底時改提示往上還有內容；桌機滑鼠進入所在的 group 容器時淡出、
// 離開後恢復，手機沒有 hover 概念，改成捲動中隱藏、停止捲動後才顯示
export default function ScrollHint({ canScroll, atBottom, isScrolling }) {
  if (!canScroll) return null
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-3 flex justify-end transition-opacity duration-200 lg:group-hover:opacity-0 ${
        isScrolling ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="grid h-8 w-8 place-items-center rounded-full border border-line bg-canvas text-ink-3 shadow-md animate-bounce">
        {atBottom ? <ChevronUp size={16} strokeWidth={1.5} /> : <ChevronDown size={16} strokeWidth={1.5} />}
      </div>
    </div>
  )
}
