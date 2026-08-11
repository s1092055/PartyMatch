import { useMemo, useState } from 'react'
import { Compass } from 'lucide-react'
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
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
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

  const filtered = useMemo(
    () => applyFilters(allGroups, filters, memberGroupIds),
    [allGroups, filters, memberGroupIds],
  )

  function handleFilterChange(patch) {
    setFilters(prev => ({ ...prev, ...patch, q: patch.q !== undefined ? patch.q.trim() : prev.q }))
  }

  return (
    <div className="px-2 md:px-4">
      <PageHeader title="探索群組" className="mb-4 text-center" />

      <FilterBar filters={filters} onChange={handleFilterChange} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="沒有符合條件的群組"
          description="試著調整篩選條件"
        />
      ) : (
        // key 用篩選條件（不含 q，避免打字時每個字都重播動畫）組成，任何一個篩選變動
        // 都讓整批卡片重新掛載、重播 slide-up 進場動畫，而不是只有新出現的卡片才有動畫
        // （同一個 group.id 在篩選前後都存在的卡片預設會被 React 直接重用，不會重新播放）
        <div
          key={`${filters.category}|${filters.service}|${filters.maxPrice}|${filters.sortBy}`}
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
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
