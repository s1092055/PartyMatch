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
          試著調整預算上限、放寬評分要求，或選擇更多服務類型
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
          <div key={group.id} className="relative">
            {i < 3 && (
              <span className={`absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold shadow-sm ${
                i === 0 ? 'bg-amber-400 text-white' :
                i === 1 ? 'bg-slate-300 text-slate-700' :
                          'bg-orange-300 text-white'
              }`}>
                {i + 1}
              </span>
            )}
            <ExploreGroupCard group={group} isMember={memberGroupIds.has(group.id)} />
          </div>
        ))}
      </div>
    </div>
  )
}
