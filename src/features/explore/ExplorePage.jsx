import { startTransition, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Compass, PlusCircle, Search, Sparkles, X, Zap } from 'lucide-react'
import { getGroups, initLiveGroups, teardownLiveGroups } from '../../shared/stores/groupStore'
import { getApplicationsByUserId } from '../../shared/stores/applicationStore'
import { getServiceById } from '../../shared/utils/serviceUtils'
import { getCurrentUser } from '../../shared/stores/authStore'
import EmptyState from '../../shared/ui/EmptyState'
import PageHeader from '../../shared/layout/PageHeader'
import RevealSection from '../../shared/ui/RevealSection'
import FilterBar from './components/FilterBar'
import ExploreGroupCard from './components/ExploreGroupCard'

const DEFAULT_FILTERS = {
  keyword:  '',
  category: 'all',
  service:  'all',
  maxPrice: 'any',
  sortBy:   'recommended',
}

const score = g => g.hostRating / 100

function applyFilters(groups, { keyword, category, service, maxPrice, sortBy }) {
  let result = groups.filter(g => g.status === 'recruiting' && g.openSeats > 0)

  if (keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    result = result.filter(g =>
      g.serviceName.toLowerCase().includes(kw) ||
      g.planName.toLowerCase().includes(kw) ||
      g.hostName.toLowerCase().includes(kw) ||
      g.tags.some(t => t.toLowerCase().includes(kw))
    )
  }

  if (category !== 'all' && service === 'all') result = result.filter(g => getServiceById(g.serviceId)?.category === category)
  if (service !== 'all') result = result.filter(g => g.serviceId === service)
  if (maxPrice !== 'any') result = result.filter(g => g.pricePerSeat <= Number(maxPrice))

  switch (sortBy) {
    case 'rating':    result.sort((a, b) => b.hostRating - a.hostRating); break
    case 'price_asc': result.sort((a, b) => a.pricePerSeat - b.pricePerSeat); break
    case 'seats':     result.sort((a, b) => a.openSeats - b.openSeats); break
    default:          result.sort((a, b) => score(b) - score(a))
  }

  return result
}

export default function ExplorePage() {
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    keyword: searchParams.get('q') ?? '',
  }))
  const navigate = useNavigate()
  const activeUserId = getCurrentUser()?.id
  const [tick, setTick] = useState(0)

  const allGroups = useMemo(
    () => getGroups().filter(g => g.hostId !== activeUserId),
    [activeUserId, tick], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const { appliedGroupIds, memberGroupIds } = useMemo(() => {
    if (!activeUserId) return { appliedGroupIds: new Set(), memberGroupIds: new Set() }
    const applied = new Set()
    const member  = new Set()
    getApplicationsByUserId(activeUserId).forEach(a => {
      if (a.status === 'pending')  applied.add(a.groupId)
      if (a.status === 'approved') member.add(a.groupId)
    })
    return { appliedGroupIds: applied, memberGroupIds: member }
  }, [activeUserId, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onGroupsChanged() { setTick(t => t + 1) }
    function onApplicationsChanged() { setTick(t => t + 1) }
    initLiveGroups()
    window.addEventListener('pm:groups-changed', onGroupsChanged)
    window.addEventListener('pm:applications-changed', onApplicationsChanged)
    return () => {
      teardownLiveGroups()
      window.removeEventListener('pm:groups-changed', onGroupsChanged)
      window.removeEventListener('pm:applications-changed', onApplicationsChanged)
    }
  }, [])

  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    startTransition(() => {
      setFilters(prev => prev.keyword === q ? prev : { ...prev, keyword: q })
    })
  }, [searchParams])

  const filtered = useMemo(() => applyFilters(allGroups, filters), [allGroups, filters])
  const hasActiveFilters = filters.keyword || filters.category !== 'all' || filters.service !== 'all' || filters.maxPrice !== 'any'

  function handleFilterChange(patch) {
    setFilters(prev => ({ ...prev, ...patch }))
  }

  return (
    <div className="px-2 md:px-4 lg:px-8 lg:px-16">
      <PageHeader title="探索群組" className="mb-4 text-center" />

      <div className="mx-auto mb-6 max-w-lg">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('pm:open-search'))}
          className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink-3 shadow-sm transition-colors hover:border-brand/40 hover:bg-raised"
        >
          <Search size={16} className="shrink-0 text-ink-3" />
          搜尋群組、服務名稱...
        </button>
      </div>

      <FilterBar filters={filters} onChange={handleFilterChange} />

      {filters.keyword && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-medium text-ink-3">搜尋：</span>
          <span className="flex items-center gap-1.5 rounded-full bg-brand-subtle px-3 py-1 text-xs font-bold text-brand">
            {filters.keyword}
            <button
              onClick={() => setFilters(prev => ({ ...prev, keyword: '' }))}
              aria-label="清除搜尋關鍵字"
              className="grid h-3.5 w-3.5 place-items-center rounded-full bg-brand/20 transition-colors hover:bg-brand/40"
            >
              <X size={9} strokeWidth={2.5} />
            </button>
          </span>
        </div>
      )}

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
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((group, i) => (
            <RevealSection key={group.id} delay={Math.min(i * 60, 300)}>
              <ExploreGroupCard group={group} isApplied={appliedGroupIds.has(group.id)} isMember={memberGroupIds.has(group.id)} />
            </RevealSection>
          ))}
          <RevealSection delay={Math.min(filtered.length * 60, 300)} className="flex flex-col gap-5">
            <div
              onClick={() => navigate('/quick-match')}
              className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brand/30 bg-brand-subtle/40 p-5 transition-colors hover:border-brand/60 hover:bg-brand-subtle"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10">
                <Zap size={24} className="text-brand" />
              </div>
              <div className="text-center">
                <p className="text-base font-extrabold text-ink">找不到合適的群組？</p>
                <p className="mt-1 text-sm text-ink-3">讓系統根據你的條件自動推薦最佳配對</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-hover">
                <Sparkles size={14} />
                前往快速配對
                <ArrowRight size={14} />
              </span>
            </div>
            <div
              onClick={() => window.dispatchEvent(new CustomEvent('pm:open-create'))}
              className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-success/30 bg-success/5 p-5 transition-colors hover:border-success/60 hover:bg-success/10"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-success/10">
                <PlusCircle size={24} className="text-success" />
              </div>
              <div className="text-center">
                <p className="text-base font-extrabold text-ink">想自己當團主？</p>
                <p className="mt-1 text-sm text-ink-3">開一個群組，設好條件，等人申請加入就好</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-lg bg-success px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-success/80">
                <PlusCircle size={14} />
                開一個群組
              </span>
            </div>
          </RevealSection>
        </div>
      )}

    </div>
  )
}
