import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Compass, Search, X } from 'lucide-react'
import { useGroupStore } from '../../shared/stores/useGroupStore'
import { useApplicationStore } from '../../shared/stores/useApplicationStore'
import { useMemberStore } from '../../shared/stores/useMemberStore'
import { applyFilters } from '../../shared/utils/searchUtils'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import EmptyState from '../../shared/ui/EmptyState'
import PageHeader from '../../shared/layout/PageHeader'
import RevealSection from '../../shared/ui/RevealSection'
import FilterBar from './components/FilterBar'
import ExploreGroupCard from './components/ExploreGroupCard'

export default function ExplorePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const filters = useMemo(() => ({
    keyword:  searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? 'all',
    service:  searchParams.get('service') ?? 'all',
    maxPrice: searchParams.get('maxPrice') ?? 'any',
    sortBy:   searchParams.get('sortBy') ?? 'recommended',
  }), [searchParams])
  const activeUserId = useAuthStore(s => s.user?.id)
  const groups = useGroupStore(s => s.groups)
  const applications = useApplicationStore(s => s.applications)
  const members = useMemberStore(s => s.members)

  const allGroups = useMemo(
    () => groups.filter(g => g.hostId !== activeUserId),
    [groups, activeUserId],
  )

  const { appliedGroupIds, memberGroupIds } = useMemo(() => {
    if (!activeUserId) return { appliedGroupIds: new Set(), memberGroupIds: new Set() }
    const applied = new Set(
      applications
        .filter(a => (a.applicantId ?? a.userId) === activeUserId && a.status === 'pending')
        .map(a => a.groupId)
    )
    const memberIds = new Set(
      members.filter(m => m.userId === activeUserId).map(m => m.groupId)
    )
    return { appliedGroupIds: applied, memberGroupIds: memberIds }
  }, [activeUserId, applications, members])

  const filtered = useMemo(() => applyFilters(allGroups, filters), [allGroups, filters])

  function handleFilterChange(patch) {
    const next = { ...filters, ...patch }
    const params = new URLSearchParams()
    if (next.keyword) params.set('q', next.keyword)
    if (next.category !== 'all') params.set('category', next.category)
    if (next.service !== 'all') params.set('service', next.service)
    if (next.maxPrice !== 'any') params.set('maxPrice', next.maxPrice)
    if (next.sortBy !== 'recommended') params.set('sortBy', next.sortBy)
    navigate(`/explore${params.toString() ? '?' + params.toString() : ''}`, { replace: true })
  }

  return (
    <div className="px-2 md:px-4 lg:px-16">
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
              onClick={() => handleFilterChange({ keyword: '' })}
              aria-label="清除搜尋關鍵字"
              className="grid h-3.5 w-3.5 place-items-center rounded-full bg-brand/20 transition-colors hover:bg-brand/40"
            >
              <X size={9} strokeWidth={2.5} />
            </button>
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="沒有符合條件的群組"
          description="試著調整篩選條件"
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((group, i) => (
            <RevealSection key={group.id} delay={Math.min(i * 60, 300)}>
              <ExploreGroupCard group={group} isApplied={appliedGroupIds.has(group.id)} isMember={memberGroupIds.has(group.id)} />
            </RevealSection>
          ))}
        </div>
      )}

    </div>
  )
}
