import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import CategoryPills from '../../../shared/ui/primitives/CategoryPills'
import CustomSelect from '../../../shared/ui/primitives/CustomSelect'
import { listServiceTypes } from '../../../shared/utils/serviceUtils'

const PRICE_OPTIONS = [
  { value: 'any', label: '不限金額' },
  { value: '100', label: 'NT$100 以下' },
  { value: '200', label: 'NT$200 以下' },
  { value: '300', label: 'NT$300 以下' },
  { value: '500', label: 'NT$500 以下' },
]

const SORT_OPTIONS = [
  { value: 'recommended', label: '推薦排序' },
  { value: 'rating',      label: '團主評分最高' },
  { value: 'price_asc',   label: '價格由低到高' },
  { value: 'seats',       label: '剩餘名額最少' },
]

const SERVICE_OPTIONS = [
  { value: 'all', label: '不限服務' },
  ...listServiceTypes().map(s => ({ value: s.id, label: s.name })),
]

export default function FilterBar({ filters, onChange }) {
  // 關鍵字輸入用本地 state + debounce，避免每個按鍵都觸發 URL replace；
  // filters.q 变動時（例如瀏覽器上一頁/下一頁）於 render 期間同步回本地 state
  const [keyword, setKeyword] = useState(filters.q)
  const [syncedQ, setSyncedQ] = useState(filters.q)
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q)
    // filters.q 是送出時 trim 過的值；若跟目前輸入內容 trim 後相同，代表這只是自己剛送出的 echo，
    // 不要覆寫本地輸入（否則使用者打到一半的尾隨空白會被吃掉）
    if (filters.q !== keyword.trim()) setKeyword(filters.q)
  }
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword.trim() !== filters.q) onChange({ q: keyword })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword])

  return (
    <div className="mb-6 space-y-3">
      <CategoryPills
        variant="grid"
        showAll
        active={filters.category}
        onChange={val => onChange({ category: val === filters.category ? 'all' : val, service: 'all' })}
      />

      <div className="relative">
        <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4" />
        <input
          type="text"
          placeholder="搜尋服務或方案名稱"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="field h-11 w-full pl-10 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <CustomSelect
          value={filters.service}
          onChange={val => onChange({ service: val, category: 'all' })}
          options={SERVICE_OPTIONS}
        />
        <CustomSelect
          value={filters.maxPrice}
          onChange={val => onChange({ maxPrice: val })}
          options={PRICE_OPTIONS}
        />
        <CustomSelect
          value={filters.sortBy}
          onChange={val => onChange({ sortBy: val })}
          options={SORT_OPTIONS}
        />
      </div>
    </div>
  )
}
