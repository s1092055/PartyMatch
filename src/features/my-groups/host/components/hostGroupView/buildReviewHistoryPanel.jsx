import { History } from 'lucide-react'
import EmptyState from '../../../../../shared/ui/primitives/EmptyState'
import CustomSelect from '../../../../../shared/ui/primitives/CustomSelect'
import { CENTERED_PANEL_BODY_CLASS } from '../../../../../shared/ui/group/panelLayout'
import ApplicationCard from './ApplicationCard'

export function buildReviewHistoryPanel({ applications, reviewFilter, setReviewFilter, groupFull, errors }) {
  const REVIEWED_STATUSES = new Set(['approved', 'rejected', 'left', 'removed'])
  const reviewedApps = applications.filter(a => REVIEWED_STATUSES.has(a.status))
  const filteredApps = reviewFilter === 'all'
    ? reviewedApps
    : reviewedApps.filter(a => a.status === reviewFilter)
  return {
    headerBorder: false,
    // 完全空狀態沒有 stickyHeader 篩選下拉，返回鍵可以浮動在左上角、不佔用整列標頭高度，
    // 讓空狀態置中位置跟同層的申請管理一致；一旦有篩選下拉就改回整列標頭，避免浮動按鈕疊上去
    floatingBack: reviewedApps.length === 0,
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
      <div className={`flex min-h-full flex-col ${CENTERED_PANEL_BODY_CLASS}`}>
        {reviewedApps.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState icon={History} title="尚無審核紀錄" description="核准或拒絕申請後會顯示在這裡。" />
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState icon={History} title="沒有符合的紀錄" />
          </div>
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
