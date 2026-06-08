import { Film, Music2, Bot, Briefcase, Cloud, BookOpen, Gamepad2, Shield } from 'lucide-react'
import logoUrl from '../../../assets/Logo.svg'

const CATEGORIES = [
  { value: '影音',   label: '影音',    Icon: Film },
  { value: '音樂',   label: '音樂',    Icon: Music2 },
  { value: 'AI工具', label: 'AI 工具', Icon: Bot },
  { value: '辦公',   label: '辦公',    Icon: Briefcase },
  { value: '雲端',   label: '雲端',    Icon: Cloud },
  { value: '學習',   label: '學習',    Icon: BookOpen },
  { value: '遊戲',   label: '遊戲',    Icon: Gamepad2 },
  { value: 'VPN',    label: 'VPN',     Icon: Shield },
]

const ALL_ITEM = { value: 'all', label: '全部', Icon: null }

export default function CategoryPills({ active, onChange, variant = 'pills', showAll = false, className = '' }) {
  const items = showAll ? [ALL_ITEM, ...CATEGORIES] : CATEGORIES

  if (variant === 'grid') {
    const cols = showAll ? 'md:grid-cols-9' : 'md:grid-cols-8'
    return (
      <div className={`flex gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid ${cols} md:overflow-visible md:py-0 ${className}`}>
        {items.map(cat => {
          const isActive = active === cat.value
          return (
            <button
              key={cat.value}
              onClick={() => onChange(cat.value)}
              className={`flex shrink-0 w-20 flex-col items-center justify-center gap-1 rounded-xl py-3.5 text-xs font-bold transition-all md:w-full md:gap-2 md:py-4 ${
                isActive
                  ? 'bg-raised text-ink md:scale-105'
                  : 'bg-transparent text-ink-2 hover:text-ink md:hover:scale-105 md:hover:bg-raised md:hover:text-ink'
              }`}
            >
              {cat.value === 'all' ? (
                <img src={logoUrl} alt="全部" className="h-6 w-6 rounded-lg object-contain md:h-8 md:w-8" />
              ) : cat.Icon && (
                <>
                  <cat.Icon size={24} className="md:hidden" strokeWidth={1.75} />
                  <cat.Icon size={28} className="hidden md:block" strokeWidth={1.75} />
                </>
              )}
              <span className="text-[10px] md:text-sm">{cat.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`flex gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
      {items.map(cat => {
        const isActive = active === cat.value
        return (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              isActive
                ? 'bg-brand text-white'
                : 'bg-raised text-ink-2 hover:bg-brand-subtle hover:text-brand'
            }`}
          >
            {cat.Icon && <cat.Icon size={12} strokeWidth={2} />}
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
