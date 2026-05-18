import { useMemo } from 'react'
import { Film, Music2, Bot, Briefcase, Cloud, BookOpen, Gamepad2, Shield } from 'lucide-react'
import { listServiceTypes } from '../../../shared/services/serviceTypes'
import CustomSelect from '../../../shared/components/ui/CustomSelect'

const CATEGORY_PILLS = [
  { value: 'all',    label: '全部',    Icon: null },
  { value: '影音',   label: '影音',    Icon: Film },
  { value: '音樂',   label: '音樂',    Icon: Music2 },
  { value: 'AI工具', label: 'AI 工具', Icon: Bot },
  { value: '辦公',   label: '辦公',    Icon: Briefcase },
  { value: '雲端',   label: '雲端',    Icon: Cloud },
  { value: '學習',   label: '學習',    Icon: BookOpen },
  { value: '遊戲',   label: '遊戲',    Icon: Gamepad2 },
  { value: 'VPN',    label: 'VPN',     Icon: Shield },
]

const PRICE_OPTIONS = [
  { value: 'any',  label: '不限價格' },
  { value: '100',  label: 'NT$100 以下' },
  { value: '150',  label: 'NT$150 以下' },
  { value: '200',  label: 'NT$200 以下' },
]

const JOIN_MODE_OPTIONS = [
  { value: 'all',      label: '所有方式' },
  { value: 'instant',  label: '立即加入' },
  { value: 'approval', label: '審核加入' },
]

const SORT_OPTIONS = [
  { value: 'recommended', label: '最新上架' },
  { value: 'rating',      label: '評分最高' },
  { value: 'price_asc',   label: '價格最低' },
  { value: 'seats',       label: '名額快滿' },
]

export default function FilterBar({ filters, onChange }) {
  const { category, service, joinMode, maxPrice, sortBy } = filters

  const serviceOptions = useMemo(() => {
    const all = listServiceTypes()
    const pool = category === 'all' ? all : all.filter(s => s.category === category)
    return [
      { value: 'all', label: '所有服務' },
      ...pool.map(s => ({ value: s.id, label: s.name })),
    ]
  }, [category])

  return (
    <div className="mb-6 space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-9 sm:overflow-visible sm:pb-0">
        {CATEGORY_PILLS.map(s => {
          const active = category === s.value
          return (
            <button
              key={s.value}
              onClick={() => onChange({ category: s.value, service: 'all' })}
              className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl py-3.5 text-xs font-bold transition-all sm:w-full sm:gap-2 sm:py-4 w-20 ${
                active
                  ? 'bg-raised text-ink sm:scale-105'
                  : 'bg-transparent text-ink-2 hover:text-ink sm:hover:scale-105 sm:hover:bg-raised sm:hover:text-ink'
              }`}
            >
              {s.value === 'all' ? (
                <img src="/src/assets/Logo.svg" alt="PartyMatch" className="h-6 w-6 rounded-lg object-contain sm:h-8 sm:w-8" />
              ) : s.Icon && (
                <>
                  <s.Icon size={24} className="sm:hidden" strokeWidth={1.75} />
                  <s.Icon size={28} className="hidden sm:block" strokeWidth={1.75} />
                </>
              )}
              <span className="text-[10px] sm:text-sm">{s.label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <CustomSelect label="選擇服務" value={service} onChange={v => onChange({ service: v })} options={serviceOptions} />
        <CustomSelect label="加入方式" value={joinMode} onChange={v => onChange({ joinMode: v })} options={JOIN_MODE_OPTIONS} />
        <CustomSelect label="價格上限" value={maxPrice} onChange={v => onChange({ maxPrice: v })} options={PRICE_OPTIONS} />
        <CustomSelect label="排序方式" value={sortBy} onChange={v => onChange({ sortBy: v })} options={SORT_OPTIONS} />
      </div>
    </div>
  )
}
