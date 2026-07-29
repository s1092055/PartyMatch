import { ClipboardList, History } from 'lucide-react'
import EmptyState from '../../../../shared/ui/primitives/EmptyState'
import { CENTERED_PANEL_BODY_CLASS } from '../../../../shared/ui/group/panelLayout'
import ApplicationCard from './ApplicationCard'

export function buildApplicationsPanel({ pendingApps, groupFull, errors, onApprove, onReject, setActivePanel, setShowReviewHistory }) {
  return {
    content: (
      <div className={`relative flex min-h-full flex-col ${CENTERED_PANEL_BODY_CLASS}`}>
        {pendingApps.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState icon={ClipboardList} title="目前沒有待審核的申請" description="新申請會出現在這裡。" />
          </div>
        ) : (
          <div className="space-y-3">
            {pendingApps.map(app => (
              <ApplicationCard
                key={app.id}
                app={app}
                groupFull={groupFull}
                error={errors?.[app.id]}
                onApprove={app => { onApprove?.(app); setActivePanel(null) }}
                onReject={onReject}
              />
            ))}
          </div>
        )}
        <button
          onClick={() => setShowReviewHistory(true)}
          className="absolute bottom-4 right-4 flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-canvas px-3 text-sm font-bold text-ink-2 transition-all hover:-translate-y-0.5 hover:bg-raised hover:text-ink"
        >
          <History size={14} strokeWidth={1.5} />
          審核紀錄
        </button>
      </div>
    ),
  }
}
