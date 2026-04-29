import { AlertTriangle } from 'lucide-react'
import { Avatar } from '../../../../components/ui/avatar'

export default function InsufficientBalanceNotice({ members }) {
  if (members.length === 0) return null

  return (
    <div className="overflow-hidden rounded-lg border border-warning/30 bg-warning-subtle">
      <div className="flex items-center gap-2 px-4 py-3">
        <AlertTriangle size={16} strokeWidth={1.5} className="shrink-0 text-warning-text" />
        <p className="text-sm font-semibold text-warning-text">
          {members.length} 位成員PM幣餘額不足，下一期扣款前可能無法完成續訂
        </p>
      </div>
      <div className="border-t border-warning/30">
        {members.map((m, i) => (
          <div key={m.userId} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-warning/20' : ''}`}>
            <Avatar initial={m.user?.avatarInitial} color={m.user?.avatarColor} size="sm" />
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{m.user?.name ?? '成員'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
