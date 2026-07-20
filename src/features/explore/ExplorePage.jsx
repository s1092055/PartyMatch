import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useGroupStore } from '../../shared/stores/useGroupStore'
import { useApplicationStore } from '../../shared/stores/useApplicationStore'
import { useMemberStore } from '../../shared/stores/useMemberStore'
import { applyFilters } from '../../shared/utils/searchUtils'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import EmptyState from '../../shared/ui/primitives/EmptyState'
import PageHeader from '../../shared/layout/PageHeader'
import RevealSection from '../../shared/ui/primitives/RevealSection'
import FilterBar from './components/FilterBar'
import ExploreGroupCard from './components/ExploreGroupCard'

export default function ExplorePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const filters = useMemo(() => ({
    category: searchParams.get('category') ?? 'all',
    service:  searchParams.get('service') ?? 'all',
    maxPrice: searchParams.get('maxPrice') ?? 'any',
    sortBy:   searchParams.get('sortBy') ?? 'recommended',
    q:        searchParams.get('q') ?? '',
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
    if (next.category !== 'all') params.set('category', next.category)
    if (next.service !== 'all') params.set('service', next.service)
    if (next.maxPrice !== 'any') params.set('maxPrice', next.maxPrice)
    if (next.sortBy !== 'recommended') params.set('sortBy', next.sortBy)
    if (next.q.trim()) params.set('q', next.q.trim())
    navigate(`/explore${params.toString() ? '?' + params.toString() : ''}`, { replace: true })
  }

  return (
    <div className="px-2 md:px-4 lg:px-16">
      <PageHeader title="探索群組" className="mb-4 text-center" />

      <FilterBar filters={filters} onChange={handleFilterChange} />

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
