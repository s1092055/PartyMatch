import { History } from 'lucide-react'
import EmptyState from '../../../../components/ui/primitives/EmptyState'
import { CENTERED_PANEL_BODY_CLASS } from '../../../../components/ui/group/panelLayout'
import ApplicationCard from './ApplicationCard'

export function buildReviewHistoryPanel({ applications, groupFull, errors }) {
  const REVIEWED_STATUSES = new Set(['approved', 'rejected']);
  const reviewedApps = applications.filter(a => REVIEWED_STATUSES.has(a.status))
  return {
    floatingBack: true,
    content: (
      <div className={`flex min-h-full flex-col ${CENTERED_PANEL_BODY_CLASS}`}>
        {reviewedApps.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState icon={History} title="尚無審核紀錄" description="接受或拒絕申請後會顯示在這裡。" />
          </div>
        ) : (
          (<div className="space-y-3 pt-14">
            {reviewedApps.map(app => (
              <ApplicationCard
                key={app.id}
                app={app}
                groupFull={groupFull}
                error={errors?.[app.id]}
              />
            ))}
          </div>)
        )}
      </div>
    ),
  };
}
