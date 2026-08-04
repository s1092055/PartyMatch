import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import CategoryPills from '../../../components/ui/primitives/CategoryPills'
import FilterSelect from '../../../components/ui/primitives/FilterSelect'
import { useFilterSelectGroup } from '../../../components/ui/primitives/useFilterSelectGroup'
import { CATEGORIES } from '../../../common/data/serviceCategories'
import ServiceLogo from '../../../components/ui/ServiceLogo'
import { Input } from '../../../components/ui/input'
import { TokenBadge } from '../../../components/ui/TokenAmount'
import { listServiceTypes } from '../../../common/utils/serviceUtils'

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
      category: s.category,
      icon: <ServiceLogo serviceId={s.id} size={20} className="shrink-0" />,
    })),
  ]
}

function groupServiceOptions(options) {
  const byCategory = new Map()
  for (const o of options) {
    if (o.value === 'all') continue
    if (!byCategory.has(o.category)) byCategory.set(o.category, [])
    byCategory.get(o.category).push(o)
  }
  const order = [...CATEGORIES.map(c => c.value), ...byCategory.keys()]
  const seen = new Set()
  return order.filter(c => byCategory.has(c) && !seen.has(c) && seen.add(c)).map(c => ({
    category: c,
    label: CATEGORIES.find(cat => cat.value === c)?.label ?? c,
    items: byCategory.get(c),
  }))
}

function findOption(options, value) {
  return options.find(o => o.value === value)
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

  const serviceOptions = useMemo(() => buildServiceOptions(filters.category), [filters.category])
  const groupedServiceOptions = useMemo(
    () => filters.category === 'all' ? groupServiceOptions(serviceOptions) : null,
    [filters.category, serviceOptions],
  )
  const serviceGroups = useMemo(() => {
    const allItem = { value: 'all', label: '不限服務' }
    if (groupedServiceOptions) {
      return [{ label: null, items: [allItem] }, ...groupedServiceOptions.map(g => ({ label: g.label, items: g.items }))]
    }
    return [{ label: null, items: [allItem, ...serviceOptions.filter(o => o.value !== 'all')] }]
  }, [groupedServiceOptions, serviceOptions])

  const isCustomPrice = filters.maxPrice !== 'any' && !PRICE_PRESETS.includes(filters.maxPrice)
  const priceOptions = useMemo(
    () => buildPriceOptions(isCustomPrice, filters.maxPrice),
    [isCustomPrice, filters.maxPrice],
  )
  const priceGroups = useMemo(() => [{ label: null, items: priceOptions }], [priceOptions])
  const sortGroups = useMemo(() => [{ label: null, items: SORT_OPTIONS }], [])
  const [customEditing, setCustomEditing] = useState(false)
  const [customPriceInput, setCustomPriceInput] = useState(isCustomPrice ? filters.maxPrice : '')
  const filterSelectGroup = useFilterSelectGroup()

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

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="flex h-11 min-w-0 items-center rounded-control border border-line bg-surface px-3.5 transition-[border-color,box-shadow] focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-subtle md:flex-[2]">
          <div className="flex flex-1 items-center gap-2">
            <Search size={16} strokeWidth={1.5} className="pointer-events-none shrink-0 text-ink-4" />
            <input
              type="text"
              placeholder="搜尋服務或方案名稱"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-left text-sm outline-none placeholder:text-ink-4"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-3 md:flex-[4]">
          <FilterSelect
            id="service"
            group={filterSelectGroup}
            value={filters.service}
            onChange={val => onChange({ service: val, category: 'all' })}
            groups={serviceGroups}
            className="h-11 w-full font-bold"
            triggerContent={(
              <span className="flex min-w-0 items-center gap-1.5">
                {findOption(serviceOptions, filters.service)?.icon}
                <span className="truncate">{findOption(serviceOptions, filters.service)?.label}</span>
              </span>
            )}
          />
          {customEditing ? (
            <div className="relative w-full min-w-0 flex-1">
              <TokenBadge className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                type="number"
                min="1"
                autoFocus
                placeholder="輸入 PM 幣金額上限"
                value={customPriceInput}
                onChange={e => setCustomPriceInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitCustomPrice() }}
                onBlur={submitCustomPrice}
                className="h-11 pl-9 pr-3 text-sm font-bold"
              />
            </div>
          ) : (
            <FilterSelect
              id="price"
              group={filterSelectGroup}
              value={isCustomPrice ? 'custom' : filters.maxPrice}
              onChange={handlePriceChange}
              groups={priceGroups}
              className="h-11 w-full font-bold"
              triggerContent={(
                <span className="flex min-w-0 items-center gap-1.5">
                  {findOption(priceOptions, isCustomPrice ? 'custom' : filters.maxPrice)?.icon}
                  <span className="truncate">{findOption(priceOptions, isCustomPrice ? 'custom' : filters.maxPrice)?.label}</span>
                </span>
              )}
            />
          )}
          <FilterSelect
            id="sort"
            group={filterSelectGroup}
            value={filters.sortBy}
            onChange={val => onChange({ sortBy: val })}
            groups={sortGroups}
            className="h-11 w-full font-bold"
            triggerContent={(
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate">{findOption(SORT_OPTIONS, filters.sortBy)?.label}</span>
              </span>
            )}
          />
        </div>
      </div>
    </div>
  )
}
