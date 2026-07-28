import { Users } from 'lucide-react'
import EmptyState from '../../../../shared/ui/primitives/EmptyState'
import { CENTERED_PANEL_BODY_CLASS } from '../../../../shared/ui/group/panelLayout'
import ApplicationCard from './ApplicationCard'

export function buildMemberHistoryPanel({ applications, groupFull, errors }) {
  // 只留成員異動本身（退出/移除）；已接受/已拒絕是審核動作，跟審核紀錄互不重疊
  const MEMBER_HISTORY_STATUSES = new Set(['removed', 'left'])
  const historyApps = applications.filter(a => MEMBER_HISTORY_STATUSES.has(a.status))
  return {
    // 沒有篩選下拉了，一律用浮動返回鍵的版面，不用整列標頭
    floatingBack: true,
    content: (
      <div className={`flex min-h-full flex-col ${CENTERED_PANEL_BODY_CLASS}`}>
        {historyApps.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState icon={Users} title="尚無成員紀錄" description="成員退出或被移除後會顯示在這裡。" />
          </div>
        ) : (
          // 返回鍵浮動在左上角（絕對定位，top-3 left-3、h-8 w-8，佔到約 44px 高），這裡多留的
          // 頂部空間要蓋過那 44px 再留一點喘息空間，不然第一張卡片會貼著返回鍵
          <div className="space-y-3 pt-14">
            {historyApps.map(app => (
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
