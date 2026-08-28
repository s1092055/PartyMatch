import { ClipboardList, History } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import EmptyState from '../../../../components/ui/primitives/EmptyState'
import { CENTERED_PANEL_BODY_CLASS } from '../../../../components/ui/group/panelLayout'
import ApplicationCard from './ApplicationCard'

export function buildApplicationsPanel({ pendingApps, groupFull, errors, onApprove, onReject, setShowReviewHistory }) {
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
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
          </div>
        )}
        <Button
          variant="ghost"
          onClick={() => setShowReviewHistory(true)}
          className="absolute bottom-4 right-4 h-9 shrink-0 rounded-lg border border-line bg-canvas px-3"
        >
          <History size={14} strokeWidth={1.5} />
          審核紀錄
        </Button>
      </div>
    ),
  }
}
