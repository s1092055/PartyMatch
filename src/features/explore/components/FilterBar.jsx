import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import CategoryPills from '../../../shared/ui/primitives/CategoryPills'
import CustomSelect from '../../../shared/ui/primitives/CustomSelect'
import ServiceLogo from '../../../shared/ui/ServiceLogo'
import { TokenBadge } from '../../../shared/ui/TokenAmount'
import { listServiceTypes } from '../../../shared/utils/serviceUtils'
import { useClickOutside } from '../../../shared/utils/hooks'

const PRICE_PRESETS = ['any', '100', '200', '300', '500']

const priceIcon = <TokenBadge className="h-4 w-4" />

function buildPriceOptions(isCustomPrice, customPrice) {
  return [
    { value: 'any', label: '不限金額' },
    { value: '100', label: '100 以下', icon: priceIcon },
    { value: '200', label: '200 以下', icon: priceIcon },
    { value: '300', label: '300 以下', icon: priceIcon },
    { value: '500', label: '500 以下', icon: priceIcon },
    { value: 'custom', label: isCustomPrice ? `${customPrice} 以下（自訂）` : '自訂金額', icon: isCustomPrice ? priceIcon : null },
  ]
}

const SORT_OPTIONS = [
  { value: 'recommended', label: '推薦排序' },
  { value: 'rating',      label: '團主評分最高' },
  { value: 'price_asc',   label: '價格由低到高' },
  { value: 'seats',       label: '剩餘名額最少' },
]

function buildServiceOptions(category) {
  const services = listServiceTypes().filter(s => category === 'all' || s.category === category)
  return [
    { value: 'all', label: '不限服務' },
    ...services.map(s => ({
      value: s.id,
      label: s.name,
      icon: <ServiceLogo serviceId={s.id} size={20} className="shrink-0 rounded-md" />,
    })),
  ]
}

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

  const [filtersOpen, setFiltersOpen] = useState(false)
  const filterBarRef = useRef(null)
  const hasActiveFilters = filters.service !== 'all' || filters.maxPrice !== 'any' || filters.sortBy !== 'recommended'

  useClickOutside(filtersOpen, [filterBarRef], () => setFiltersOpen(false))

  const serviceOptions = useMemo(() => buildServiceOptions(filters.category), [filters.category])

  const isCustomPrice = filters.maxPrice !== 'any' && !PRICE_PRESETS.includes(filters.maxPrice)
  const priceOptions = useMemo(
    () => buildPriceOptions(isCustomPrice, filters.maxPrice),
    [isCustomPrice, filters.maxPrice],
  )
  const [customEditing, setCustomEditing] = useState(false)
  const [customPriceInput, setCustomPriceInput] = useState(isCustomPrice ? filters.maxPrice : '')

  function handlePriceChange(val) {
    if (val === 'custom') {
      setCustomPriceInput(isCustomPrice ? filters.maxPrice : '')
      setCustomEditing(true)
      return
    }
    onChange({ maxPrice: val })
  }

  function submitCustomPrice() {
    const trimmed = customPriceInput.trim()
    if (!trimmed) {
      setCustomEditing(false)
      return
    }
    const n = Number(trimmed)
    if (n > 0) {
      onChange({ maxPrice: String(n) })
      setCustomEditing(false)
    }
    // 輸入非正數或非數字時保留編輯狀態，讓使用者修正，不靜默捨棄
  }

  return (
    <div className="mb-6 space-y-3">
      <CategoryPills
        variant="grid"
        showAll
        active={filters.category}
        onChange={val => onChange({ category: val === filters.category ? 'all' : val, service: 'all' })}
      />

      <div ref={filterBarRef}>
        <div className="field relative flex h-11 items-center">
          <div className="flex flex-1 items-center justify-center gap-2">
            <Search size={16} strokeWidth={1.5} className="pointer-events-none shrink-0 text-ink-4" />
            <input
              type="text"
              placeholder="搜尋服務或方案名稱"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="max-w-full min-w-0 [field-sizing:content] bg-transparent text-left text-sm outline-none placeholder:text-ink-4"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(v => !v)}
            aria-label="篩選"
            aria-expanded={filtersOpen}
            className={`absolute right-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
              filtersOpen ? 'bg-brand-subtle text-brand' : 'text-ink-4 hover:bg-raised hover:text-ink'
            }`}
          >
            <SlidersHorizontal size={16} strokeWidth={1.5} />
            {hasActiveFilters && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-brand" />
            )}
          </button>
        </div>

        {filtersOpen && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <CustomSelect
              value={filters.service}
              onChange={val => onChange({ service: val, category: 'all' })}
              options={serviceOptions}
            />
            {customEditing ? (
              <div className="relative min-w-0 flex-1">
                <TokenBadge className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  autoFocus
                  placeholder="輸入 PM 幣金額上限"
                  value={customPriceInput}
                  onChange={e => setCustomPriceInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitCustomPrice() }}
                  onBlur={submitCustomPrice}
                  className="field h-11 w-full pl-9 pr-3 text-sm font-bold"
                />
              </div>
            ) : (
              <CustomSelect
                value={isCustomPrice ? 'custom' : filters.maxPrice}
                onChange={handlePriceChange}
                options={priceOptions}
              />
            )}
            <CustomSelect
              value={filters.sortBy}
              onChange={val => onChange({ sortBy: val })}
              options={SORT_OPTIONS}
            />
          </div>
        )}
      </div>
    </div>
  )
}
