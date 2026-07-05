import { CheckCircle2, Plus } from 'lucide-react'
import { TokenBadge } from '../../../shared/ui/TokenAmount'

export default function ProfileHeaderCard({ user }) {
  return (
    <div className="card p-6 mb-5 flex flex-col md:flex-row items-start md:items-center gap-5">

      <div className="relative shrink-0">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold"
          style={{ backgroundColor: user.avatarColor }}
        >
          {(user.displayName ?? '使')[0]}
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
        <p className="text-sm text-ink-3">{user.email}</p>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <p className="text-xs font-medium text-ink-4">代幣餘額</p>
        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1.5">
            <TokenBadge className="h-7 w-7 text-xs" />
            <span className="text-2xl font-black text-ink">{(user.tokenBalance ?? 0).toLocaleString()}</span>
          </div>
          <button
            className="grid h-8 w-8 place-items-center rounded-full border border-brand text-brand transition-colors hover:bg-brand hover:text-white"
            aria-label="儲值"
            title="儲值"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

    </div>
  )
}
