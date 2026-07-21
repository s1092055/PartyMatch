import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Search } from 'lucide-react'
import MatchConditionBar from '../MatchConditionBar'
import ExploreGroupCard from '../../../explore/components/ExploreGroupCard'
import { useMemberStore } from '../../../../shared/stores/useMemberStore'
import { useAuthStore } from '../../../../shared/stores/useAuthStore'

export default function Step4Results({ results, conditions }) {
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
        <Search size={40} className="mb-4 text-ink-4" />
        <p className="mb-1 text-base font-extrabold text-ink">沒有符合條件的群組</p>
        <p className="max-w-xs text-sm text-ink-3">
          試著調整每人申請費用、放寬團主信用分數要求，或選擇更多服務類型
        </p>
        <button
          onClick={() => navigate('/explore')}
          className="mt-6 flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-bold text-ink-2 transition-colors hover:border-brand/40 hover:text-brand"
        >
          <Compass size={14} />
          探索所有群組
        </button>
      </div>
    )
  }

  return (
    <div className="pt-2 pb-3 lg:pt-3 lg:pb-6">
      <MatchConditionBar conditions={conditions} showEdit={false} />
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((group, i) => (
          <ExploreGroupCard
            key={group.id}
            group={group}
            isMember={memberGroupIds.has(group.id)}
            rank={i < 3 ? i + 1 : undefined}
          />
        ))}
      </div>
    </div>
  )
}
