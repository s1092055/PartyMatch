import { ClipboardList, History } from 'lucide-react'
import EmptyState from '../../../../../shared/ui/primitives/EmptyState'
import ApplicationCard from './ApplicationCard'

export function buildApplicationsPanel({ pendingApps, groupFull, errors, onApprove, onReject, setActivePanel, setShowReviewHistory }) {
  return {
    content: (
      <div className="relative flex min-h-full flex-col px-5 pb-16 pt-3">
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
          className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full border border-line bg-canvas text-ink-3 transition-colors hover:border-brand hover:text-brand"
          title="審核紀錄"
        >
          <History size={20} strokeWidth={1.5} />
        </button>
      </div>
    ),
  }
}
