import { CheckCircle2, BarChart2, CreditCard } from 'lucide-react'
import Avatar from '../../../shared/ui/Avatar'
import CreditScoreBadge from '../../../shared/ui/CreditScoreBadge'

export default function ProfileHeaderCard({ user, activeSubs = [], totalSubs = 0 }) {
  const monthly = activeSubs.reduce((sum, s) => sum + (s.pricePerSeat ?? 0), 0)

  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-stretch">

      {/* 頭像 + 名稱 + 信用分數 */}
      <div className="card flex shrink-0 flex-col items-center gap-3 p-5 md:flex-row md:items-center md:gap-4">
        <div className="relative shrink-0">
          <Avatar
            initial={user.avatarInitial ?? (user.displayName ?? '使')[0]}
            color={user.avatarColor}
            size="xl"
          />
          {user.isVerified && (
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow">
              <CheckCircle2 size={18} className="text-brand" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 text-center md:text-left">
          <div className="mb-0.5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <h2 className="text-xl font-bold text-ink">{user.displayName}</h2>
            {user.isVerified && (
              <span className="badge badge-blue">
                <CheckCircle2 size={11} /> 已驗證
              </span>
            )}
          </div>
          <p className="mb-2 text-sm text-ink-3">{user.email}</p>
          <CreditScoreBadge score={user.creditScore} size="sm" />
        </div>
      </div>

      {/* 訂閱統計 */}
      <div className="card flex flex-1 flex-col justify-center gap-2 px-6 py-5">
        <div className="flex items-center justify-center gap-1 text-xs font-medium text-ink-3 md:justify-start">
          <BarChart2 size={12} />
          訂閱統計
        </div>
        <div className="flex items-center justify-around">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-black text-ink">{activeSubs.length}</span>
            <span className="text-xs text-ink-3">活躍</span>
          </div>
          <div className="h-8 w-px bg-line" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-black text-ink">{totalSubs}</span>
            <span className="text-xs text-ink-3">累計</span>
          </div>
          <div className="h-8 w-px bg-line" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-black text-ink">{monthly.toLocaleString()}</span>
            <span className="text-xs text-ink-3">本月 PM</span>
          </div>
        </div>
      </div>

    </div>
  )
}
