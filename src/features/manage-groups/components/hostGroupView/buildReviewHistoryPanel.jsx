import { History } from 'lucide-react'
import EmptyState from '../../../../shared/ui/primitives/EmptyState'
import { CENTERED_PANEL_BODY_CLASS } from '../../../../shared/ui/group/panelLayout'
import ApplicationCard from './ApplicationCard'

export function buildReviewHistoryPanel({ applications, groupFull, errors }) {
  // 只留審核結果本身（接受/拒絕）；已退出/已移除是成員異動，不是審核動作，不該混在這裡
  const REVIEWED_STATUSES = new Set(['approved', 'rejected'])
  const reviewedApps = applications.filter(a => REVIEWED_STATUSES.has(a.status))
  return {
    // 沒有篩選下拉了，一律用浮動返回鍵的版面，不用整列標頭
    floatingBack: true,
    content: (
      <div className={`flex min-h-full flex-col ${CENTERED_PANEL_BODY_CLASS}`}>
        {reviewedApps.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState icon={History} title="尚無審核紀錄" description="接受或拒絕申請後會顯示在這裡。" />
          </div>
        ) : (
          // 返回鍵浮動在左上角（絕對定位，top-3 left-3、h-8 w-8，佔到約 44px 高），這裡多留的
          // 頂部空間要蓋過那 44px 再留一點喘息空間，不然第一張卡片會貼著返回鍵
          <div className="space-y-3 pt-14">
            {reviewedApps.map(app => (
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
