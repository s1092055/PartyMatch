import { ChevronDown, ChevronUp } from 'lucide-react'

export default function ScrollHint({ canScroll, atBottom, isScrolling }) {
  if (!canScroll) return null
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-3 flex justify-end pr-2 md:pr-6 transition-opacity duration-200 can-hover:group-hover:opacity-0 ${
        isScrolling ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="grid h-8 w-8 place-items-center rounded-full border border-line bg-canvas text-ink-3 shadow-floating animate-bounce">
        {atBottom ? <ChevronUp size={16} strokeWidth={1.5} /> : <ChevronDown size={16} strokeWidth={1.5} />}
      </div>
    </div>
  )
}
