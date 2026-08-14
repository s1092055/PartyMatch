import { ChevronDown } from 'lucide-react'

// 跟 Hero 底部同一套「下滑查看更多」視覺提示，純裝飾用（不可點擊、不會捲動頁面），
// 手機版避開 MobileDock（約佔 76px 高）用 bottom-24，桌機／可 hover 裝置維持 bottom-16
export default function ScrollCue() {
  return (
    <span
      className="pointer-events-none absolute bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-sm font-bold text-ink-2 can-hover:lg:bottom-16"
    >
      下滑查看更多
      <ChevronDown size={16} strokeWidth={1.5} />
    </span>
  )
}
