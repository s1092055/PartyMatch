import { ClipboardList, History } from 'lucide-react'
import EmptyState from '../../../../../shared/ui/EmptyState'
import ApplicationCard from './ApplicationCard'

export function buildApplicationsPanel({ pendingApps, groupFull, errors, onApprove, onReject, setActivePanel, setShowReviewHistory }) {
  return {
    title: '申請管理',
    icon: <ClipboardList size={18} className="text-brand" />,
    headerRight: (
      <button
        onClick={() => setShowReviewHistory(true)}
        className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-brand"
        title="審核紀錄"
      >
        <History size={18} />
      </button>
    ),
    content: (
      <div className="px-5 pb-5 pt-3">
        {pendingApps.length === 0 ? (
          <EmptyState icon={ClipboardList} title="目前沒有待審核的申請" description="新申請會出現在這裡。" />
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
      </div>
    ),
  }
}
