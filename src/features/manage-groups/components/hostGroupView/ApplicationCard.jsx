import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Avatar } from '../../../../components/ui/avatar'
import { Button } from '../../../../components/ui/button'
import CreditScoreBadge from '../../../../components/ui/CreditScoreBadge'
import { PresenceDot } from '../../../../common/layout/components/navShared'
import { formatDateTime, formatRelativeDate } from '../../../../common/utils/date'

const APP_STATUS_BADGE = {
  approved: { cls: 'bg-success-subtle text-success-text', label: '已接受' },
  rejected: { cls: 'bg-danger-subtle text-danger-text',   label: '已拒絕' },
  left:     { cls: 'bg-raised text-ink-3',                label: '已退出' },
  removed:  { cls: 'bg-danger-subtle text-danger-text',   label: '已移除' },
}

export default function ApplicationCard({ app, groupFull, error, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false)
  const name    = app.applicantName ?? app.userName ?? '申請者'
  const initial = app.applicantAvatarInitial ?? app.userAvatarInitial ?? name[0]
  const color   = app.applicantAvatarColor ?? app.userAvatarColor ?? '#64718A'
  const presenceStatus = app.applicantPresenceStatus ?? app.userPresenceStatus ?? 'offline'
  const isPending = app.status === 'pending'
  const badge = APP_STATUS_BADGE[app.status]

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="relative inline-block shrink-0">
          <Avatar initial={initial} color={color} size="md" />
          <PresenceDot status={presenceStatus} className="absolute -bottom-0.5 -right-0.5 h-3 w-3" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">{name}</p>
                <CreditScoreBadge score={app.applicantCreditScore ?? 80} />
              </div>
              <p className="mt-0.5 text-2xs text-ink-4">
                {isPending ? formatRelativeDate(app.createdAt) : formatDateTime(app.createdAt)}
              </p>
            </div>
            {!isPending && badge && (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>
                {badge.label}
              </span>
            )}
          </div>
          {app.message && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-1 text-xs text-ink-3 transition-colors hover:text-ink"
              >
                申請留言 {expanded ? <ChevronUp size={11} strokeWidth={1.5} /> : <ChevronDown size={11} strokeWidth={1.5} />}
              </button>
              {expanded && (
                <p className="mt-1.5 rounded-lg bg-raised px-3 py-2 text-xs leading-relaxed text-ink-2">{app.message}</p>
              )}
            </div>
          )}
          {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
          {isPending && (
            <div className="mt-3 flex gap-2">
              <Button
                variant="default"
                onClick={() => onApprove(app.id)}
                disabled={groupFull}
                className="h-auto flex-1 rounded-lg py-2 text-xs"
              >
                {groupFull ? '已額滿' : <><Check size={12} strokeWidth={1.5} /> 接受</>}
              </Button>
              <Button
                variant="destructive"
                onClick={() => onReject(app.id)}
                className="h-auto flex-1 rounded-lg py-2 text-xs"
              >
                <X size={12} strokeWidth={1.5} /> 拒絕
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
