import { memo } from 'react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import ServiceLogo from '../../../components/ui/ServiceLogo'
import TokenAmount from '../../../components/ui/TokenAmount'
import { toISODate } from '../../../common/utils/date'
import { isEffectivelyActive } from '../../../common/utils/groupStatus'
import { getRenewalAwareStatus } from '../../../common/utils/groupStatusDisplay'
import { calcDisplayPrice, calcDisplayCycle } from '../../../common/utils/pricingUtils'
import { getServiceById } from '../../../common/utils/serviceUtils'
import { hasFilledServiceInfo } from '../../../common/utils/serviceInfoFields'

function getBadgeStatus(sub) {
  const status = sub.groupStatus ?? sub.status
  return isEffectivelyActive(status, sub.confirmedAt) ? 'active' : status
}

function StatCell({ label, children, highlight }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2.5 text-center">
      <span className="text-2xs font-bold text-ink-3">{label}</span>
      <span className={`text-sm font-black leading-tight ${highlight ?? 'text-ink'}`}>{children}</span>
    </div>
  )
}

function SubscriptionCard({ sub, onViewGroup }) {
  const badgeStatus   = getBadgeStatus(sub)
  const displayStatus = getRenewalAwareStatus(badgeStatus, sub.nextBillingDate)
  const isActive      = badgeStatus === 'active'
  const memberCount   = sub.usedSeats ?? 0

  // 下次扣款日鎖定群組當下就已經算出來（見鎖定群組流程文件），只是還沒到啟用服務那一步
  // 定案前都算「預估」；待成員填寫／待啟用／確認期／申訴中這幾個階段都已經過了鎖定，
  // 顯示這個日期比「加入日期」更有參考價值，招募中/額滿/已解散/已結束則還沒鎖定，維持加入日期
  const rawStatus        = sub.groupStatus ?? sub.status
  const isPreBillingLock = rawStatus === 'pending_confirmation' || rawStatus === 'pending_activation'
  const showsBillingDate = isPreBillingLock || rawStatus === 'confirming' || rawStatus === 'disputed'

  // 已填完服務帳號、還在等其他成員的話，卡片不能顯示跟「還沒填」一樣的「成員填寫中」，
  // 不然會讓人誤以為自己還沒填寫；改成綠色「已填寫完成」，跟群組詳情 Modal 的判斷邏輯一致
  const sharingMethod   = getServiceById(sub.serviceId)?.sharingMethod
  const isSharedCredentials = sharingMethod === 'shared_credentials'
  const waitingForOthers = badgeStatus === 'pending_confirmation' &&
    hasFilledServiceInfo(sub.serviceInfo, sharingMethod) && !sub.serviceInfoIssueNote

  return (
    <Card
      as="article"
      className="card-lift relative flex min-h-full cursor-pointer flex-col overflow-hidden p-5"
      onClick={() => onViewGroup?.(sub)}
    >
      <div className="flex justify-center">
        <StatusBadge
          status={waitingForOthers ? 'active' : displayStatus === 'recruiting' ? 'member_joined' : displayStatus}
          label={
            waitingForOthers ? (isSharedCredentials ? '已提取完成' : '已填寫完成') :
            displayStatus === 'full' ? '等待鎖定' :
            displayStatus === 'pending_confirmation' && isSharedCredentials ? '帳號提取中' :
            undefined
          }
        />
      </div>

      <div className="mt-4 flex justify-center">
        <ServiceLogo serviceId={sub.serviceId} size={80} className="border-line-strong" />
      </div>

      <div className="mt-3 text-center">
        <h2 className="text-xl font-black leading-tight text-ink">{sub.serviceName}</h2>
        <p className="mt-1 text-sm font-semibold text-ink-3">{sub.planName}</p>
        <p className="mt-1 text-base font-extrabold text-ink">
          <TokenAmount
            amount={calcDisplayPrice(sub.pricePerSeat, sub.billingCycle)}
            cycle={calcDisplayCycle(sub.billingCycle)}
          />
        </p>
      </div>

      <div className="my-4 border-t border-line-subtle" />

      <div className="grid grid-cols-3 divide-x divide-line-subtle rounded-lg border border-line-subtle">
        <StatCell label="團主">{sub.hostName ?? '—'}</StatCell>
        <StatCell label="群組人數">{memberCount} 人</StatCell>
        {isActive ? (
          <StatCell label="下期收費">{toISODate(sub.nextBillingDate, '—')}</StatCell>
        ) : showsBillingDate ? (
          <StatCell label={isPreBillingLock ? '預估下次扣款' : '下次扣款'}>{toISODate(sub.nextBillingDate, '—')}</StatCell>
        ) : (
          <StatCell label="加入日期">{sub.joinedAt ?? '—'}</StatCell>
        )}
      </div>

      <div className="mt-auto pt-5">
        <Button onClick={e => { e.stopPropagation(); onViewGroup?.(sub) }} className="w-full">
          查看群組
        </Button>
      </div>
    </Card>
  )
}

export default memo(SubscriptionCard, (prev, next) =>
  prev.sub.id === next.sub.id &&
  prev.sub.groupStatus === next.sub.groupStatus &&
  prev.sub.confirmedAt === next.sub.confirmedAt &&
  prev.sub.nextBillingDate === next.sub.nextBillingDate &&
  prev.sub.serviceInfo === next.sub.serviceInfo &&
  prev.sub.serviceInfoIssueNote === next.sub.serviceInfoIssueNote &&
  prev.onViewGroup === next.onViewGroup
)
