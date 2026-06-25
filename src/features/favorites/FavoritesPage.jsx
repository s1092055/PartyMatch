import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import EmptyState from '../../shared/ui/EmptyState'
import { getCurrentUser } from '../../shared/stores/authStore'
import PageHeader from '../../shared/layout/PageHeader'
import { getFavoritesByUserId } from '../../shared/stores/favoriteStore'
import { getGroupById } from '../../shared/stores/groupStore'
import { getMemberGroupIds } from '../../shared/stores/memberStore'
import { getServiceById } from '../../shared/utils/serviceUtils'
import ExploreGroupCard from '../explore/components/ExploreGroupCard'
import CategoryPills from '../../shared/ui/CategoryPills'

function loadFavGroups() {
  const activeUser = getCurrentUser()
  if (!activeUser) return []

  return getFavoritesByUserId(activeUser.id)
    .map(f => getGroupById(f.groupId))
    .filter(Boolean)
}

export default function FavoritesPage() {
  const navigate = useNavigate()
  const activeUser = getCurrentUser()
  const [groups, setGroups] = useState(loadFavGroups)
  const memberGroupIds = useMemo(() => getMemberGroupIds(activeUser?.id), [activeUser?.id])
  const [activeCategory, setActiveCategory] = useState('all')

  function handleFavChange(isFav, groupId) {
    if (!isFav) {
      setGroups(prev => prev.filter(g => g.id !== groupId))
    }
  }

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
          description="在探索頁面或群組詳情頁點擊 ♥ 加入收藏"
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
                onFavChange={handleFavChange}
                isMember={memberGroupIds.has(group.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
