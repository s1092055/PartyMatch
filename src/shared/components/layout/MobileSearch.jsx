import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Zap } from 'lucide-react'
import {
  addRecentSearch,
  loadRecentSearches,
  removeRecentSearch,
  saveRecentSearches,
  searchGroups,
} from '../../utils/searchUtils'
import ServiceLogo from '../ui/ServiceLogo'
import { useScrollLock } from '../../utils/hooks'

export default function MobileSearch() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen]                 = useState(false)
  const [searchQuery, setSearchQuery]       = useState('')
  const [recentSearches, setRecentSearches] = useState(loadRecentSearches)
  const inputRef = useRef(null)

  const searchResults = useMemo(() => searchGroups(searchQuery), [searchQuery])

  useScrollLock(isOpen)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      let alive = true
      const timer = setTimeout(() => { if (alive) setSearchQuery('') }, 0)
      return () => { alive = false; clearTimeout(timer) }
    }
  }, [isOpen])

  useEffect(() => {
    const handler = () => setIsOpen(true)
    window.addEventListener('pm:open-search', handler)
    return () => window.removeEventListener('pm:open-search', handler)
  }, [])

  useEffect(() => {
    function onKeyDown(e) { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleSearchSubmit(term) {
    const t = (term ?? searchQuery).trim()
    if (!t) return
    addRecentSearch(t)
    setRecentSearches(loadRecentSearches())
    navigate(`/explore?q=${encodeURIComponent(t)}`)
    setIsOpen(false)
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
          <h2 className="text-lg font-extrabold text-ink">搜尋</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
            aria-label="關閉"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search input */}
        <div className="shrink-0 px-5 py-4">
          <div className="relative">
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
        </div>

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
                      navigate(`/groups/${group.id}`)
                      setIsOpen(false)
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-raised"
                  >
                    <ServiceLogo serviceId={group.serviceId} size={36} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{group.serviceName}</p>
                      <p className="truncate text-xs text-ink-3">{group.planName} · NT${group.pricePerSeat}/月</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                      group.joinMode === 'instant'
                        ? 'bg-success-subtle text-success-text'
                        : 'bg-raised text-ink-3'
                    }`}>
                      {group.joinMode === 'instant' ? '立即' : '審核'}
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

        {searchQuery && (
          <div className="shrink-0 border-t border-line px-4 py-3">
            <button
              onClick={() => handleSearchSubmit()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
            >
              <Zap size={14} />
              在探索頁查看全部結果
            </button>
          </div>
        )}
      </div>
    </>
  )
}
