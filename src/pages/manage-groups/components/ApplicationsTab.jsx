import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, ClipboardList, X } from 'lucide-react'
import Avatar from '../../../shared/components/ui/Avatar'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import EmptyState from '../../../shared/components/ui/EmptyState'
import { getGroups } from '../../../shared/stores/groupStore'

const _groupServiceMap = new Map(getGroups().map(g => [g.id, g.serviceId]))

function resolveServiceId(app) {
  return app.serviceId ?? _groupServiceMap.get(app.groupId) ?? 'spotify'
}

function ApplicationCard({ app, groupFull, error, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false)
  const name      = app.applicantName ?? app.userName ?? '申請者'
  const initial   = app.applicantAvatarInitial ?? app.userAvatarInitial ?? name[0]
  const color     = app.applicantAvatarColor ?? app.userAvatarColor ?? '#94A3B8'
  const serviceId = resolveServiceId(app)
  const isPending = app.status === 'pending'

  return (
    <div className={`rounded-2xl border border-line bg-white p-4 shadow-sm transition-opacity ${isPending ? '' : 'opacity-60'}`}>
      <div className="flex items-start gap-3">
        <Avatar initial={initial} color={color} size="md" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{name}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <ServiceLogo serviceId={serviceId} size={16} />
                <p className="truncate text-xs text-ink-3">{app.groupName ?? app.serviceName}</p>
              </div>
              <p className="mt-0.5 text-[11px] text-ink-4">{app.createdAt}</p>
            </div>

            {!isPending && (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                app.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-600'
              }`}>
                {app.status === 'approved' ? '已核准' : '已拒絕'}
              </span>
            )}
          </div>

          {app.message && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-1 text-xs text-ink-3 hover:text-ink transition-colors"
              >
                申請留言 {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
              {expanded && (
                <p className="mt-1.5 rounded-xl bg-raised px-3 py-2 text-xs leading-relaxed text-ink-2">
                  {app.message}
                </p>
              )}
            </div>
          )}

          {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}

          {isPending && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onApprove(app.id)}
                disabled={groupFull}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-40"
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

export default function ApplicationsTab({ applications, seatMap, errors, onApprove, onReject }) {
  if (applications.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="目前沒有任何申請紀錄"
        description="你建立的群組暫時沒有新的加入申請。"
      />
    )
  }

  return (
    <div className="space-y-3">
      {applications.map(app => (
        <ApplicationCard
          key={app.id}
          app={app}
          groupFull={(seatMap?.[app.groupId]?.openSeats ?? 1) <= 0}
          error={errors?.[app.id]}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  )
}
