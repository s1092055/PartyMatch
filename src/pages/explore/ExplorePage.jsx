import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Compass, Search, X, Zap } from 'lucide-react'
import { getGroups } from '../../shared/stores/groupStore'
import { getServiceTypeById } from '../../shared/services/serviceTypes'
import GroupCard from '../../shared/components/cards/GroupCard'
import EmptyState from '../../shared/components/ui/EmptyState'
import FilterBar from './components/FilterBar'

const DEFAULT_FILTERS = {
  keyword:  '',
  category: 'all',
  service:  'all',
  joinMode: 'all',
  maxPrice: 'any',
  sortBy:   'recommended',
}

const score = g => (g.isHostVerified ? 2 : 0) + (g.joinMode === 'instant' ? 1 : 0) + g.hostRating / 5

function applyFilters(groups, { keyword, category, service, joinMode, maxPrice, sortBy }) {
  let result = groups.filter(g => g.status === 'recruiting')

  if (keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    result = result.filter(g =>
      g.serviceName.toLowerCase().includes(kw) ||
      g.planName.toLowerCase().includes(kw) ||
      g.hostName.toLowerCase().includes(kw) ||
      g.description.toLowerCase().includes(kw) ||
      g.tags.some(t => t.toLowerCase().includes(kw))
    )
  }

  if (category !== 'all' && service === 'all') result = result.filter(g => getServiceTypeById(g.serviceId)?.category === category)
  if (service !== 'all') result = result.filter(g => g.serviceId === service)
  if (joinMode !== 'all') result = result.filter(g => g.joinMode === joinMode)
  if (maxPrice !== 'any') result = result.filter(g => g.pricePerSeat <= Number(maxPrice))

  switch (sortBy) {
    case 'rating':    result.sort((a, b) => b.hostRating - a.hostRating); break
    case 'price_asc': result.sort((a, b) => a.pricePerSeat - b.pricePerSeat); break
    case 'seats':     result.sort((a, b) => a.openSeats - b.openSeats); break
    default:          result.sort((a, b) => score(b) - score(a))
  }

  return result
}

function SearchModal({ keyword, onChange, onClose, resultCount }) {
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-[22vh] z-[60] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl bg-white p-5 shadow-2xl">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="搜尋服務名稱、方案、團主..."
            value={keyword}
            onChange={e => onChange({ keyword: e.target.value })}
            className="h-12 w-full rounded-xl border border-line bg-raised pl-10 pr-10 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
          />
          {keyword && (
            <button
              onClick={() => onChange({ keyword: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 grid h-5 w-5 place-items-center rounded-full bg-ink-3 text-white transition-colors hover:bg-ink"
              aria-label="清除搜尋"
            >
              <X size={11} />
            </button>
          )}
        </div>

        {keyword ? (
          <p className="mt-3 text-sm text-ink-3">
            找到 <span className="font-bold text-ink">{resultCount}</span> 個符合「{keyword}」的群組
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-3">輸入關鍵字搜尋群組</p>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
        >
          查看結果
        </button>
      </div>
    </>
  )
}

export default function ExplorePage() {
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    keyword: searchParams.get('q') ?? '',
  }))
  const [showSearch, setShowSearch] = useState(false)

  const navigate = useNavigate()
  const allGroups = useMemo(() => getGroups(), [])

  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    if (!q) return
    startTransition(() => {
      setFilters(prev => prev.keyword === q ? prev : { ...prev, keyword: q })
    })
  }, [searchParams])

  const filtered = useMemo(() => applyFilters(allGroups, filters), [allGroups, filters])
  const hasActiveFilters = filters.keyword || filters.category !== 'all' || filters.service !== 'all' || filters.joinMode !== 'all' || filters.maxPrice !== 'any'

  function handleFilterChange(patch) {
    setFilters(prev => ({ ...prev, ...patch }))
  }

  return (
    <div className="px-2 sm:px-4 lg:px-8 xl:px-16">
      <div className="hidden pb-5 pt-2 sm:block">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">探索群組</h1>
        <p className="mt-1 text-sm text-ink-3">找到適合你的共享訂閱</p>
      </div>

      <div className="mb-4 pt-2 text-center sm:hidden">
        <h1 className="text-xl font-extrabold tracking-tight text-ink">探索群組</h1>
      </div>

      <FilterBar filters={filters} onChange={handleFilterChange} />

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-ink-3">
          {hasActiveFilters ? `找到 ${filtered.length} 個群組` : `共 ${filtered.length} 個群組`}
        </p>
        {hasActiveFilters && (
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="text-sm font-bold text-brand hover:underline"
          >
            清除篩選
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="沒有符合條件的群組"
          description="試著調整篩選條件，或清除所有篩選"
          actionLabel="清除篩選"
          onAction={() => setFilters(DEFAULT_FILTERS)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      <div className="mb-4 mt-10 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-xs leading-relaxed text-amber-800">
          PartyMatch 為群組媒合平台，不代管費用或帳號。部分服務（如 ChatGPT、Claude、Adobe CC 等）無官方共享方案，加入前請自行確認該服務之使用條款。因帳號共享所產生之任何損失，平台概不負責。
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between rounded-xl border border-line bg-raised px-5 py-4">
        <div>
          <p className="text-sm font-extrabold text-ink">找不到合適的群組？</p>
          <p className="mt-0.5 text-xs text-ink-3">讓系統根據你的條件自動推薦</p>
        </div>
        <button
          onClick={() => navigate('/quick-match')}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
        >
          <Zap size={14} />
          快速配對
        </button>
      </div>

      <button
        onClick={() => setShowSearch(true)}
        className="fixed bottom-6 right-6 z-30 hidden md:flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-transform hover:scale-105 hover:bg-brand-hover relative"
        aria-label="搜尋群組"
      >
        {filters.keyword ? (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
            1
          </span>
        ) : null}
        <Search size={22} />
      </button>

      {showSearch && (
        <SearchModal
          keyword={filters.keyword}
          onChange={handleFilterChange}
          onClose={() => setShowSearch(false)}
          resultCount={filtered.length}
        />
      )}
    </div>
  )
}
