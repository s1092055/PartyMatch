import { useState } from 'react'
import { UserX, Calendar } from 'lucide-react'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import Avatar from '../../../shared/components/ui/Avatar'
import EmptyState from '../../../shared/components/ui/EmptyState'
import PaymentStatusBadge from '../../../shared/components/ui/PaymentStatusBadge'
import { CONFIRMED_STATUSES } from '../../../shared/constants/paymentStatus'

export default function MemberManagementPanel({ members, focusGroupId, groups, onRemove }) {
  const [removingId, setRemovingId] = useState(null)

  const displayMembers = focusGroupId
    ? members.filter(m => m.groupId === focusGroupId)
    : members

  const focusGroup = focusGroupId ? groups.find(g => g.id === focusGroupId) : null

  function canRemoveMember(member) {
    return !CONFIRMED_STATUSES.includes(member.paymentStatus)
  }

  return (
    <div className="space-y-4">
      {focusGroup && (
        <div className="flex items-center gap-3 rounded-[var(--radius-inner)] border border-brand-border bg-brand-subtle px-4 py-3">
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

      {displayMembers.length === 0 ? (
        <EmptyState icon={UserX} title="此群組目前沒有成員" className="py-10" />
      ) : (
        <div className="space-y-3">
          {displayMembers.map(m => {
            const removable = canRemoveMember(m)
            return (
              <div key={m.id} className="card flex items-center gap-4 p-4">
                <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="md" />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{m.userName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-ink-3">
                      <Calendar size={11} />
                      加入 {m.joinedAt}
                    </span>
                  </div>
                </div>

                <PaymentStatusBadge status={m.paymentStatus} />

                <div className="shrink-0">
                  {removable ? (
                    removingId === m.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { onRemove?.(m); setRemovingId(null) }}
                          className="rounded-lg bg-danger px-2 py-1 text-2xs font-semibold text-white transition-colors hover:bg-red-700"
                        >
                          確認移除
                        </button>
                        <button
                          onClick={() => setRemovingId(null)}
                          className="rounded-lg border border-line px-2 py-1 text-2xs font-semibold text-ink-2 transition-colors hover:bg-raised"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRemovingId(m.id)}
                        className="flex items-center gap-1 text-xs text-red-400 transition-colors hover:text-red-600"
                      >
                        <UserX size={13} />
                        移除
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-ink-4">—</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
