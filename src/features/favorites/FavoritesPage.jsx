import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import EmptyState from '../../shared/ui/primitives/EmptyState'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import PageHeader from '../../shared/layout/PageHeader'
import { useFavoriteStore } from '../../shared/stores/useFavoriteStore'
import { useGroupStore } from '../../shared/stores/useGroupStore'
import { useMemberStore } from '../../shared/stores/useMemberStore'
import ExploreGroupCard from '../explore/components/ExploreGroupCard'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const activeUser = useAuthStore(s => s.user)
  const favorites = useFavoriteStore(s => s.favorites)
  const allGroups = useGroupStore(s => s.groups)
  const members = useMemberStore(s => s.members)

  const groups = useMemo(() => {
    if (!activeUser) return []
    const byId = new Map(allGroups.map(g => [g.id, g]))
    return favorites
      .filter(f => f.userId === activeUser.id)
      .map(f => byId.get(f.groupId))
      // 跟探索頁（searchUtils.js 的 applyFilters）用同一條件：只顯示還進得去的招募中群組，
      // 不然收藏清單會留著額滿/已解散/已結束等點進去也不能申請的群組
      .filter(g => g && g.status === 'recruiting' && g.openSeats > 0)
  }, [activeUser, favorites, allGroups])

  const memberGroupIds = useMemo(
    () => new Set(members.filter(m => m.userId === activeUser?.id).map(m => m.groupId)),
    [members, activeUser?.id],
  )

  return (
    <div className="px-2 md:px-4 lg:px-16">
      <PageHeader
        title="我的收藏"
        className="mb-6 text-center"
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="尚無收藏群組"
          description="在探索頁面或群組詳情頁點擊愛心圖示加入收藏"
          actionLabel="探索群組"
          onAction={() => navigate('/explore')}
          className="py-16"
        />
      ) : (
        <>
          <p className="text-xs text-ink-3 mb-4 text-right">共 {groups.length} 個收藏群組</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(group => (
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
