import { ChevronDown, ChevronUp } from 'lucide-react'

// 浮動捲動提示按鈕：內容可捲動時顯示，點擊在「捲到底」與「回到頂部」間切換
export default function ScrollHintButton({ canScroll, atBottom, onScrollToTop, onScrollDown }) {
  if (!canScroll) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 hidden justify-end lg:flex">
      <button
        onClick={atBottom ? onScrollToTop : onScrollDown}
        className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full border border-line bg-canvas shadow-md text-ink-3 transition-colors hover:text-ink animate-bounce"
        title={atBottom ? '回到頂部' : '往下捲動'}
      >
        {atBottom ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </div>
  )
}
