import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Search } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import ExploreGroupCard from '../../../explore/components/ExploreGroupCard'
import { useMemberStore } from '../../../../common/stores/useMemberStore'
import { useAuthStore } from '../../../../common/stores/useAuthStore'

export default function Step4Results({ results }) {
  const navigate = useNavigate()
  const activeUserId = useAuthStore(s => s.user?.id)
  const members = useMemberStore(s => s.members)
  const memberGroupIds = useMemo(
    () => new Set(members.filter(m => m.userId === activeUserId).map(m => m.groupId)),
    [members, activeUserId],
  )

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <Search strokeWidth={1.5} size={40} className="mb-4 text-ink-4" />
        <p className="mb-1 text-base font-extrabold text-ink">沒有符合條件的群組</p>
        <p className="max-w-xs text-sm text-ink-3">
          試著調整每人申請費用、放寬團主信用分數要求，或選擇更多服務類型
        </p>
        <Button
          variant="ghost"
          onClick={() => navigate('/explore')}
          className="mt-6 rounded-lg border border-line hover:border-brand/40 hover:text-brand"
        >
          <Compass strokeWidth={1.5} size={14} />
          探索所有群組
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
      {results.map((group, i) => (
        <ExploreGroupCard
          key={group.id}
          group={group}
          isMember={memberGroupIds.has(group.id)}
          rank={i < 3 ? i + 1 : undefined}
        />
      ))}
    </div>
  )
}
