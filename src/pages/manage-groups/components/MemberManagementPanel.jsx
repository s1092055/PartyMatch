import { useState } from 'react'
import { UserX, CheckCircle2, Clock } from 'lucide-react'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import Avatar from '../../../shared/components/ui/Avatar'
import EmptyState from '../../../shared/components/ui/EmptyState'

const REMOVABLE_STATUSES = new Set(['recruiting', 'pending_activation'])

export default function MemberManagementPanel({ members, focusGroupId, groups, onRemove }) {
  const [removingId, setRemovingId] = useState(null)

  const displayMembers = focusGroupId
    ? members.filter(m => m.groupId === focusGroupId)
    : members

  const focusGroup = focusGroupId ? groups.find(g => g.id === focusGroupId) : null
  const canRemove = focusGroup ? REMOVABLE_STATUSES.has(focusGroup.status) : false

  return (
    <div className="space-y-4">
      {focusGroup && (
        <div className="flex items-center gap-3 bg-brand-subtle border border-brand-border rounded-[var(--radius-inner)] px-4 py-3">
          <ServiceLogo serviceId={focusGroup.serviceId} size={32} />
          <div>
            <p className="text-sm font-semibold text-ink">{focusGroup.serviceName}</p>
            <p className="text-xs text-ink-3">{focusGroup.planName}</p>
          </div>
          <span className="ml-auto text-xs text-brand">
            {focusGroup.usedSeats}/{focusGroup.totalSeats} 人
          </span>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-3 bg-raised border-b border-line-subtle text-xs font-medium text-ink-4 uppercase tracking-wide">
          <span>成員</span>
          <span>所屬群組</span>
          <span>加入日期</span>
          <span>付款狀態</span>
          <span>操作</span>
        </div>

        {displayMembers.length === 0 ? (
          <EmptyState icon={UserX} title="此群組目前沒有成員" className="py-10" />
        ) : (
          <div className="divide-y divide-line-subtle">
            {displayMembers.map(m => (
              <div
                key={m.id}
                className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-3 md:gap-4 px-5 py-4 items-center hover:bg-raised transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{m.userName}</p>
                    <p className="text-xs text-ink-3">一般成員</p>
                  </div>
                </div>

                <p className="text-sm text-ink-2 truncate">{m.groupName}</p>

                <p className="text-sm text-ink-2">{m.joinedAt}</p>

                <div>
                  {m.paymentStatus === 'paid' ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 size={12} /> 已付款
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <Clock size={12} /> 待付款
                    </span>
                  )}
                </div>

                <div>
                  {canRemove && removingId === m.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { onRemove?.(m); setRemovingId(null) }}
                        className="rounded-lg bg-danger px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-red-700"
                      >
                        確認
                      </button>
                      <button
                        onClick={() => setRemovingId(null)}
                        className="rounded-lg border border-line px-2 py-1 text-[11px] font-semibold text-ink-2 transition-colors hover:bg-raised"
                      >
                        取消
                      </button>
                    </div>
                  ) : canRemove ? (
                    <button
                      onClick={() => setRemovingId(m.id)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
                    >
                      <UserX size={12} />
                      移除成員
                    </button>
                  ) : (
                    <span className="text-xs text-ink-4">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
