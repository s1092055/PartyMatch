import { Search } from 'lucide-react'
import { cn } from '../../../lib/utils'

// 訊息中心／通知中心左側列表上方的搜尋框，樣式共用
export default function SearchInput({ value, onChange, placeholder, className }) {
  return (
    <div className={cn('flex flex-1 items-center gap-2 rounded-lg border border-transparent bg-raised px-3 py-2 transition-[box-shadow] focus-within:ring-4 focus-within:ring-brand-subtle', className)}>
      <Search size={14} className="shrink-0 text-ink-4" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
      />
    </div>
  )
}
