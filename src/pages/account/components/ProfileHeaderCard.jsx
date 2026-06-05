import { CheckCircle2, Calendar, Users, Edit2 } from 'lucide-react'
import CreditScoreBadge from '../../../shared/components/ui/CreditScoreBadge'

export default function ProfileHeaderCard({ user, onEdit }) {
  return (
    <div className="card p-6 mb-5 flex flex-col md:flex-row items-start md:items-center gap-5">

      <div className="relative shrink-0">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold"
          style={{ backgroundColor: user.avatarColor }}
        >
          {user.displayName[0]}
        </div>
        {user.isVerified && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow">
            <CheckCircle2 size={18} className="text-brand" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <h2 className="text-xl font-bold text-ink">{user.displayName}</h2>
          {user.isVerified && (
            <span className="badge badge-blue">
              <CheckCircle2 size={11} /> 已驗證
            </span>
          )}
        </div>
        <p className="text-sm text-ink-3 mb-4">{user.email}</p>

        <div className="flex flex-wrap gap-5">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-ink-3" />
            <div>
              <p className="text-xs text-ink-3">加入時間</p>
              <p className="text-sm font-semibold text-ink-2">{user.createdAt}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-ink-3" />
            <div>
              <p className="text-xs text-ink-3">已加入群組</p>
              <p className="text-sm font-semibold text-ink-2">{user.joinedGroups.length} 個</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div>
              <p className="text-xs text-ink-3 mb-1">信用分數</p>
              <CreditScoreBadge score={user.creditScore} size="md" />
            </div>
          </div>
        </div>
      </div>

<button
        onClick={onEdit}
        className="flex items-center gap-1.5 text-sm text-ink-3 border border-line px-3 py-2 rounded-[var(--radius-inner)] hover:bg-raised transition-colors shrink-0"
      >
        <Edit2 size={14} />
        編輯資料
      </button>
    </div>
  )
}
