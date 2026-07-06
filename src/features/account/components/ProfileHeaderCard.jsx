import { CheckCircle2, BarChart2, TrendingUp, CreditCard } from 'lucide-react'
import CreditScoreBadge from '../../../shared/ui/CreditScoreBadge'

export default function ProfileHeaderCard({ user, activeSubs = [], totalSubs = 0 }) {
  const monthly = activeSubs.reduce((sum, s) => sum + (s.pricePerSeat ?? 0), 0)

  return (
    <div className="card p-6 mb-5 flex flex-col md:flex-row items-start md:items-center gap-6">

      {/* 左側：頭像 + 名稱 */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="relative shrink-0">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold"
            style={{ backgroundColor: user.avatarColor ?? '#3B82F6' }}
          >
            {(user.displayName ?? '使')[0]}
          </div>
          {user.isVerified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow">
              <CheckCircle2 size={18} className="text-brand" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h2 className="text-xl font-bold text-ink">{user.displayName}</h2>
            {user.isVerified && (
              <span className="badge badge-blue">
                <CheckCircle2 size={11} /> 已驗證
              </span>
            )}
          </div>
          <p className="text-sm text-ink-3">{user.email}</p>
        </div>
      </div>

      {/* 右側：信用分數 + 訂閱統計（桌面版顯示） */}
      <div className="hidden md:flex items-center gap-6 shrink-0">
        {/* 信用分數 */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1 text-xs font-medium text-ink-3">
            <TrendingUp size={12} />
            信用分數
          </div>
          <CreditScoreBadge score={user.creditScore} size="md" />
        </div>

        <div className="w-px h-12 bg-line" />

        {/* 訂閱統計 */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1 text-xs font-medium text-ink-3 mb-0.5">
            <BarChart2 size={12} />
            訂閱統計
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-sm">
              <CreditCard size={13} className="text-ink-4" />
              <span className="text-ink-3">活躍</span>
              <span className="font-bold text-ink">{activeSubs.length}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <CheckCircle2 size={13} className="text-ink-4" />
              <span className="text-ink-3">累計</span>
              <span className="font-bold text-ink">{totalSubs}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp size={13} className="text-ink-4" />
              <span className="text-ink-3">本月</span>
              <span className="font-bold text-ink">PM {monthly.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
