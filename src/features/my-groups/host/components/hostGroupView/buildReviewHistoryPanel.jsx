import { History } from 'lucide-react'
import EmptyState from '../../../../../shared/ui/primitives/EmptyState'
import CustomSelect from '../../../../../shared/ui/primitives/CustomSelect'
import ApplicationCard from './ApplicationCard'

export function buildReviewHistoryPanel({ applications, reviewFilter, setReviewFilter, groupFull, errors }) {
  const REVIEWED_STATUSES = new Set(['approved', 'rejected', 'left', 'removed'])
  const reviewedApps = applications.filter(a => REVIEWED_STATUSES.has(a.status))
  const filteredApps = reviewFilter === 'all'
    ? reviewedApps
    : reviewedApps.filter(a => a.status === reviewFilter)
  return {
    title: '審核紀錄',
    icon: <History size={18} className="text-brand" />,
    stickyHeader: reviewedApps.length > 0 ? (
      <div className="border-b border-line-subtle px-5 py-3">
        <CustomSelect
          value={reviewFilter}
          onChange={setReviewFilter}
          options={[
            { value: 'all',      label: `全部（${reviewedApps.length}）` },
            { value: 'approved', label: `已核准（${reviewedApps.filter(a => a.status === 'approved').length}）` },
            { value: 'left',     label: `已退出（${reviewedApps.filter(a => a.status === 'left').length}）` },
            { value: 'removed',  label: `已移除（${reviewedApps.filter(a => a.status === 'removed').length}）` },
            { value: 'rejected', label: `已拒絕（${reviewedApps.filter(a => a.status === 'rejected').length}）` },
          ]}
        />
      </div>
    ) : null,
    content: (
      <div className="px-5 pb-5 pt-3">
        {reviewedApps.length === 0 ? (
          <EmptyState icon={History} title="尚無審核紀錄" description="核准或拒絕申請後會顯示在這裡。" />
        ) : filteredApps.length === 0 ? (
          <EmptyState icon={History} title="沒有符合的紀錄" />
        ) : (
          <div className="space-y-3">
            {filteredApps.map(app => (
              <ApplicationCard
                key={app.id}
                app={app}
                groupFull={groupFull}
                error={errors?.[app.id]}
                onApprove={() => {}}
                onReject={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    ),
  }
}
