import { memo } from 'react'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import GroupCardHeader from '../../../components/ui/group/GroupCardHeader'
import { StatCell, StatCellGrid } from '../../../components/ui/group/StatCellGrid'
import { toISODate } from '../../../common/utils/date'
import { isEffectivelyActive } from '../../../common/utils/groupStatus'
import { getRenewalAwareStatus } from '../../../common/utils/groupStatusDisplay'
import { getServiceById } from '../../../common/utils/serviceUtils'
import { hasFilledServiceInfo, isSharedCredentialsMethod } from '../../../common/utils/serviceInfoFields'

function getBadgeStatus(sub) {
  const status = sub.groupStatus ?? sub.status
  return isEffectivelyActive(status, sub.confirmedAt) ? 'active' : status
}

function SubscriptionCard({ sub, onViewGroup }) {
  const badgeStatus   = getBadgeStatus(sub)
  const displayStatus = getRenewalAwareStatus(badgeStatus, sub.nextBillingDate)
  const isActive      = badgeStatus === 'active'
  const memberCount   = sub.usedSeats ?? 0

  const rawStatus        = sub.groupStatus ?? sub.status;
  const isPreBillingLock = rawStatus === 'pending_confirmation' || rawStatus === 'pending_activation'
  const showsBillingDate = isPreBillingLock || rawStatus === 'confirming' || rawStatus === 'disputed'

  const sharingMethod   = getServiceById(sub.serviceId)?.sharingMethod;
  const isSharedCredentials = isSharedCredentialsMethod(sharingMethod)
  const waitingForOthers = badgeStatus === 'pending_confirmation' &&
    hasFilledServiceInfo(sub.serviceInfo, sharingMethod) && !sub.serviceInfoIssueNote

  return (
    <Card
      as="article"
      className="card-lift relative flex min-h-full cursor-pointer flex-col overflow-hidden p-5"
      onClick={() => onViewGroup?.(sub)}
    >
      <GroupCardHeader
        badge={
          <StatusBadge
            status={waitingForOthers ? 'active' : displayStatus === 'recruiting' ? 'member_joined' : displayStatus}
            label={
              waitingForOthers ? (isSharedCredentials ? '已提取完成' : '已填寫完成') :
              displayStatus === 'full' ? '等待鎖定' :
              displayStatus === 'pending_confirmation' && isSharedCredentials ? '帳號提取中' :
              undefined
            }
          />
        }
        serviceId={sub.serviceId}
        serviceName={sub.serviceName}
        planName={sub.planName}
        pricePerSeat={sub.pricePerSeat}
        billingCycle={sub.billingCycle}
      />

      <StatCellGrid>
        <StatCell label="團主">{sub.hostName ?? '—'}</StatCell>
        <StatCell label="群組人數">{memberCount} 人</StatCell>
        {isActive ? (
          <StatCell label="下期收費">{toISODate(sub.nextBillingDate, '—')}</StatCell>
        ) : showsBillingDate ? (
          <StatCell label={isPreBillingLock ? '預估下次扣款' : '下次扣款'}>{toISODate(sub.nextBillingDate, '—')}</StatCell>
        ) : (
          <StatCell label="加入日期">{sub.joinedAt ?? '—'}</StatCell>
        )}
      </StatCellGrid>

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
