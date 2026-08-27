import { useState } from 'react'
import { Heart } from 'lucide-react'
import EmptyState from '../../shared/components/ui/EmptyState'
import { getActiveUser } from '../../shared/stores/userStore'
import PageHeader from '../../shared/components/layout/PageHeader'
import { getFavoritesByUserId } from '../../shared/stores/favoriteStore'
import { getGroupById } from '../../shared/stores/groupStore'
import GroupCard from '../../shared/components/cards/GroupCard'

function loadFavGroups() {
  const activeUser = getActiveUser()
  if (!activeUser) return []

  return getFavoritesByUserId(activeUser.id)
    .map(f => getGroupById(f.groupId))
    .filter(Boolean)
}

export default function FavoritesPage() {
  const [groups, setGroups] = useState(loadFavGroups)

  function handleFavChange(isFav, groupId) {
    if (!isFav) {
      setGroups(prev => prev.filter(g => g.id !== groupId))
    }
  }

  return (
    <div>
      <PageHeader
        title="我的收藏"
        subtitle="你收藏的群組都在這裡，隨時可以申請加入。"
        className="mb-7"
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="尚無收藏群組"
          description="在探索頁面或群組詳情頁點擊 ♥ 加入收藏"
          className="py-24"
        />
      ) : (
        <>
          <p className="text-xs text-ink-3 mb-4">共 {groups.length} 個收藏群組</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups.map(group => (
              <GroupCard
                key={group.id}
                group={group}
                onFavChange={handleFavChange}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
