import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import EmptyState from '../../shared/ui/primitives/EmptyState'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import PageHeader from '../../shared/layout/PageHeader'
import { useFavoriteStore } from '../../shared/stores/useFavoriteStore'
import { useGroupStore } from '../../shared/stores/useGroupStore'
import { useMemberStore } from '../../shared/stores/useMemberStore'
import { getServiceById } from '../../shared/utils/serviceUtils'
import ExploreGroupCard from '../explore/components/ExploreGroupCard'
import CategoryPills from '../../shared/ui/primitives/CategoryPills'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const activeUser = useAuthStore(s => s.user)
  const favorites = useFavoriteStore(s => s.favorites)
  const allGroups = useGroupStore(s => s.groups)
  const members = useMemberStore(s => s.members)
  const [activeCategory, setActiveCategory] = useState('all')

  const groups = useMemo(() => {
    if (!activeUser) return []
    const byId = new Map(allGroups.map(g => [g.id, g]))
    return favorites
      .filter(f => f.userId === activeUser.id)
      .map(f => byId.get(f.groupId))
      .filter(Boolean)
  }, [activeUser, favorites, allGroups])

  const memberGroupIds = useMemo(
    () => new Set(members.filter(m => m.userId === activeUser?.id).map(m => m.groupId)),
    [members, activeUser?.id],
  )

  const filtered = activeCategory === 'all'
    ? groups
    : groups.filter(g => getServiceById(g.serviceId)?.category === activeCategory)

  return (
    <div className="px-2 md:px-4 lg:px-16">
      <PageHeader
        title="我的收藏"
        className="mb-6 text-center"
      />

      <CategoryPills variant="grid" showAll active={activeCategory} onChange={setActiveCategory} className="mb-5" />

      {groups.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="尚無收藏群組"
          description="在探索頁面或群組詳情頁點擊愛心圖示加入收藏"
          actionLabel="去探索群組"
          onAction={() => navigate('/explore')}
          className="py-16"
        />
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-ink-3">此分類沒有收藏的群組</div>
      ) : (
        <>
          <p className="text-xs text-ink-3 mb-4">共 {filtered.length} 個收藏群組</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(group => (
              <ExploreGroupCard
                key={group.id}
                group={group}
                isMember={memberGroupIds.has(group.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
