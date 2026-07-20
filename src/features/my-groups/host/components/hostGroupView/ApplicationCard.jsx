import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react'
import Avatar from '../../../../../shared/ui/primitives/Avatar'
import CreditScoreBadge from '../../../../../shared/ui/CreditScoreBadge'
import { formatRelativeDate } from '../../../../../shared/utils/date'

const APP_STATUS_BADGE = {
  approved: { cls: 'bg-success-subtle text-success-text', label: '已核准' },
  left:     { cls: 'bg-slate-100 text-slate-500',         label: '已退出' },
  removed:  { cls: 'bg-danger-subtle text-danger-text',   label: '已移除' },
  rejected: { cls: 'bg-danger-subtle text-danger-text',   label: '已拒絕' },
}

export default function ApplicationCard({ app, groupFull, error, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false)
  const name    = app.applicantName ?? app.userName ?? '申請者'
  const initial = app.applicantAvatarInitial ?? app.userAvatarInitial ?? name[0]
  const color   = app.applicantAvatarColor ?? app.userAvatarColor ?? '#94A3B8'
  const isPending = app.status === 'pending'
  const badge = APP_STATUS_BADGE[app.status]

  return (
    <div className={`rounded-2xl border border-line bg-surface p-4 transition-opacity ${isPending ? '' : 'opacity-60'}`}>
      <div className="flex items-start gap-3">
        <Avatar initial={initial} color={color} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">{name}</p>
                <CreditScoreBadge score={app.applicantCreditScore ?? 80} />
              </div>
              <p className="mt-0.5 text-2xs text-ink-4">{formatRelativeDate(app.createdAt)}</p>
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
                <p className="mt-1.5 rounded-xl bg-raised px-3 py-2 text-xs leading-relaxed text-ink-2">{app.message}</p>
              )}
            </div>
          )}
          {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
          {isPending && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onApprove(app.id)}
                disabled={groupFull}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-success py-2 text-xs font-semibold text-white transition-colors hover:bg-success-text disabled:pointer-events-none disabled:opacity-40"
              >
                {groupFull ? '已額滿' : <><Check size={12} strokeWidth={3} /> 核准</>}
              </button>
              <button
                onClick={() => onReject(app.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-xs font-semibold text-ink-2 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <X size={12} strokeWidth={3} /> 拒絕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
