import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react'
import {
  addRecentSearch,
  applyFilters,
  loadRecentSearches,
  removeRecentSearch,
  saveRecentSearches,
} from '../utils/searchUtils'
import { listServiceTypes } from '../utils/serviceUtils'
import { useGroupStore } from '../stores/useGroupStore'
import { useAuthStore } from '../stores/useAuthStore'
import ServiceLogo from '../ui/ServiceLogo'
import CustomSelect from '../ui/CustomSelect'
import CategoryPills from '../ui/CategoryPills'
import { useScrollLock } from '../utils/hooks'
import { DEFAULT_FILTERS, PRICE_OPTIONS, SORT_OPTIONS } from '../../features/explore/exploreConstants'

export default function MobileSearch() {
  const [isOpen, setIsOpen]                 = useState(false)
  const [searchQuery, setSearchQuery]       = useState('')
  const [recentSearches, setRecentSearches] = useState(loadRecentSearches)
  const [filters, setFilters]               = useState(DEFAULT_FILTERS)
  const [showFilters, setShowFilters]       = useState(false)
  const inputRef   = useRef(null)
  const pillsRef   = useRef(null)

  const groups = useGroupStore(s => s.groups)
  const activeUserId = useAuthStore(s => s.user?.id)

  // 搜尋結果只在 modal 內部顯示，跟探索頁的群組池、篩選狀態完全獨立
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const pool = groups.filter(g => g.hostId !== activeUserId)
    return applyFilters(pool, { keyword: searchQuery, ...filters }).slice(0, 12)
  }, [groups, activeUserId, searchQuery, filters])

  const serviceOptions = useMemo(() => {
    const all = listServiceTypes()
    const pool = filters.category === 'all' ? all : all.filter(s => s.category === filters.category)
    return [
      { value: 'all', label: '所有服務' },
      ...pool.map(s => ({ value: s.id, label: s.name })),
    ]
  }, [filters.category])

  const hasActiveFilters = filters.category !== 'all' || filters.service !== 'all' || filters.maxPrice !== 'any' || filters.sortBy !== 'recommended'

  useScrollLock(isOpen)

  useEffect(() => {
    if (isOpen) {
      if (pillsRef.current) pillsRef.current.scrollLeft = 0
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      const timer = setTimeout(() => {
        setSearchQuery('')
        setFilters(DEFAULT_FILTERS)
        setShowFilters(false)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    const handler = () => setIsOpen(true)
    window.addEventListener('pm:open-search', handler)
    return () => window.removeEventListener('pm:open-search', handler)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e) { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  function handleSearchSubmit(term) {
    const t = (term ?? searchQuery).trim()
    if (t) addRecentSearch(t)
    setRecentSearches(loadRecentSearches())
    setSearchQuery(t)
  }

  function handleRemoveRecent(term, e) {
    e.stopPropagation()
    removeRecentSearch(term)
    setRecentSearches(loadRecentSearches())
  }

  function handleClearAll() {
    saveRecentSearches([])
    setRecentSearches([])
  }

  function updateFilter(patch) {
    setFilters(prev => {
      const next = { ...prev, ...patch }
      // 切換分類時重設服務
      if (patch.category) next.service = 'all'
      return next
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-[55] bg-black/50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Modal */}
      <div
        className={`fixed left-1/2 top-1/2 z-[56] flex h-[85vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 ${
          isOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-brand" />
            <h2 className="text-lg font-extrabold text-ink">搜尋</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink active:scale-100 active:opacity-70"
            aria-label="關閉"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search input + filter toggle */}
        <div className="shrink-0 flex items-center gap-2 px-5 pt-4 pb-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              ref={inputRef}
              type="text"
              placeholder="搜尋群組、服務..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit() }}
              className="w-full rounded-xl bg-raised py-3 pl-9 pr-9 text-sm font-medium text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 grid h-4 w-4 place-items-center rounded-full bg-ink-3 text-white"
              >
                <X size={10} />
              </button>
            )}
          </div>
          <button
            onClick={() => { setShowFilters(v => !v); if (pillsRef.current) pillsRef.current.scrollLeft = 0 }}
            className={`shrink-0 self-stretch flex items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-colors ${
              hasActiveFilters
                ? 'bg-brand text-white'
                : 'bg-raised text-ink-3 hover:bg-brand-subtle hover:text-brand'
            }`}
          >
            <SlidersHorizontal size={14} />
            篩選
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/30 text-[10px]">
                {[filters.category !== 'all', filters.service !== 'all', filters.maxPrice !== 'any', filters.sortBy !== 'recommended'].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="shrink-0 border-t border-line-subtle bg-surface-soft px-5 py-4 space-y-4">
            <div className="relative flex items-center gap-1">
              <button
                onClick={() => pillsRef.current?.scrollBy({ left: -120, behavior: 'smooth' })}
                className="hidden md:grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-canvas text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              >
                <ChevronLeft size={14} />
              </button>
              <CategoryPills
                innerRef={pillsRef}
                showAll
                active={filters.category}
                onChange={val => updateFilter({ category: val })}
                className="flex-1"
              />
              <button
                onClick={() => pillsRef.current?.scrollBy({ left: 120, behavior: 'smooth' })}
                className="hidden md:grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-canvas text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex gap-2">
              <CustomSelect
                value={filters.service}
                onChange={v => updateFilter({ service: v })}
                options={serviceOptions}
              />
              <CustomSelect
                value={filters.maxPrice}
                onChange={v => updateFilter({ maxPrice: v })}
                options={PRICE_OPTIONS}
              />
              <CustomSelect
                value={filters.sortBy}
                onChange={v => updateFilter({ sortBy: v })}
                options={SORT_OPTIONS}
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-xs font-bold text-brand hover:text-brand-hover"
              >
                清除篩選
              </button>
            )}
          </div>
        )}

        <div className="h-px shrink-0 bg-line-subtle" />

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {searchQuery === '' ? (
            recentSearches.length > 0 ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-extrabold text-ink">最近搜尋</p>
                  <button onClick={handleClearAll} className="text-xs font-bold text-brand hover:text-brand-hover">
                    全部清除
                  </button>
                </div>
                <div className="space-y-0.5">
                  {recentSearches.map(item => (
                    <button
                      key={item}
                      onClick={() => { setSearchQuery(item); handleSearchSubmit(item) }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-raised"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-raised">
                        <Search size={14} className="text-ink-3" />
                      </span>
                      <span className="flex-1 text-left">{item}</span>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={e => handleRemoveRecent(item, e)}
                        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleRemoveRecent(item, e)}
                        aria-label={`移除「${item}」搜尋紀錄`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
                      >
                        <X size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-6 text-center text-sm text-ink-3">沒有最近搜尋紀錄</p>
            )
          ) : searchResults.length > 0 ? (
            <>
              <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-ink-3">
                搜尋結果（{searchResults.length}）
              </p>
              <div className="space-y-1">
                {searchResults.map(group => (
                  <button
                    key={group.id}
                    onClick={() => {
                      addRecentSearch(searchQuery)
                      setRecentSearches(loadRecentSearches())
                      setIsOpen(false)
                      window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: group.id } }))
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-raised"
                  >
                    <ServiceLogo serviceId={group.serviceId} size={36} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{group.serviceName}</p>
                      <p className="truncate text-xs text-ink-3">{group.planName} · NT${group.billingCycle === 'yearly' ? group.pricePerSeat * 12 : group.pricePerSeat}/{group.billingCycle === 'yearly' ? '年' : '月'}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-raised px-2 py-0.5 text-xs font-bold text-ink-3">
                      審核
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-sm text-ink-3">找不到「<span className="font-bold text-ink">{searchQuery}</span>」的結果</p>
              <p className="mt-1 text-xs text-ink-3">試試其他關鍵字</p>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
