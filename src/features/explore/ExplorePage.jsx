import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Compass, RefreshCw } from 'lucide-react'
import { useGroupStore } from '../../common/stores/useGroupStore'
import { useApplicationStore } from '../../common/stores/useApplicationStore'
import { useMemberStore } from '../../common/stores/useMemberStore'
import { applyFilters } from '../../common/utils/searchUtils'
import { useAuthStore } from '../../common/stores/useAuthStore'
import EmptyState from '../../components/ui/primitives/EmptyState'
import PageHeader from '../../common/layout/PageHeader'
import RevealSection from '../../components/ui/primitives/RevealSection'
import FilterBar from './components/FilterBar'
import ExploreGroupCard from './components/ExploreGroupCard'

const DEFAULT_FILTERS = { category: 'all', service: 'all', maxPrice: 'any', sortBy: 'recommended', q: '' }

export default function ExplorePage() {
  const location = useLocation();
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    q:       location.state?.q?.trim() ?? '',
    service: location.state?.service ?? DEFAULT_FILTERS.service,
  }))
  const activeUserId = useAuthStore(s => s.user?.id)
  const groups = useGroupStore(s => s.groups)
  const applications = useApplicationStore(s => s.applications)
  const members = useMemberStore(s => s.members)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    useGroupStore.getState().init()
  }, [location.key])

  async function handleRefresh() {
    if (refreshing) return
    setRefreshing(true)
    try {
      await useGroupStore.getState().init()
    } finally {
      setRefreshing(false)
    }
  }

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

  const filtered = useMemo(
    () => applyFilters(allGroups, filters),
    [allGroups, filters],
  )

  function handleFilterChange(patch) {
    setFilters(prev => ({ ...prev, ...patch, q: patch.q !== undefined ? patch.q.trim() : prev.q }))
  }

  return (
    <div className="px-2 md:px-4">
      <PageHeader title="探索群組" className="mb-4 text-center" />

      <div className="fixed bottom-9 right-6 z-40 can-hover:lg:bottom-24">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="重新整理群組列表"
          className="relative grid h-14 w-14 place-items-center rounded-full border border-line bg-surface text-ink-2 shadow-floating transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand disabled:opacity-60 lg:h-12 lg:w-12 dark:border-[#238EC7] dark:text-[#238EC7]"
        >
          <span className={`inline-flex size-6 lg:size-5 ${refreshing ? 'animate-spin [animation-duration:1.6s]' : ''}`}>
            <RefreshCw className="size-full" strokeWidth={1.5} />
          </span>
        </button>
      </div>

      <FilterBar filters={filters} onChange={handleFilterChange} />
      {filtered.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="沒有符合條件的群組"
          description="試著調整篩選條件"
        />
      ) : (
        (<div
          key={`${filters.category}|${filters.service}|${filters.maxPrice}|${filters.sortBy}`}
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((group, i) => (
            <RevealSection key={group.id} delay={Math.min(i * 60, 300)}>
              <ExploreGroupCard group={group} isApplied={appliedGroupIds.has(group.id)} isMember={memberGroupIds.has(group.id)} />
            </RevealSection>
          ))}
        </div>)
      )}
    </div>
  );
}
