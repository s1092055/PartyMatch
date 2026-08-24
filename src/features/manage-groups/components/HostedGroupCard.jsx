import { memo } from 'react'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { getStatusTextColor } from '../../../components/ui/statusBadgeConfig'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import GroupCardHeader from '../../../components/ui/group/GroupCardHeader'
import { StatCell, StatCellGrid } from '../../../components/ui/group/StatCellGrid'
import { getRenewalAwareStatus } from '../../../common/utils/groupStatusDisplay'
import { toISODate } from '../../../common/utils/date'
import { getServiceById } from '../../../common/utils/serviceUtils'
import { isSharedCredentialsMethod } from '../../../common/utils/serviceInfoFields'

function getCollectionState({ group, paidCount, paymentTarget }) {
  if (['cancelled', 'ended'].includes(group.status)) return '已結束'
  if (group.status === 'recruiting') return '招募中'
  if (group.status === 'full') return '已滿員'
  if (group.status === 'pending_confirmation') return '處理中'
  if (group.status === 'pending_activation') return '待啟用服務'
  if (group.status === 'confirming') return '確認期中'
  if (group.status === 'disputed') return '問題處理中'
  if (paymentTarget > 0 && paidCount < paymentTarget && group.status === 'active') return '追蹤中'
  return '正常'
}

function HostedGroupCard({
  group,
  members,
  pendingAppCount,
  paymentCount,
  onViewGroup,
}) {
  const displayStatus = getRenewalAwareStatus(group.status, group.nextBillingDate)
  const isSharedCredentials = isSharedCredentialsMethod(getServiceById(group.serviceId)?.sharingMethod)

  const collectionState = getCollectionState({ group, paidCount: 0, paymentTarget: members.length })

  const collectionHighlight = {
    '正常':      'text-success-text',
    '招募中':    'text-success-text',
    '已結束':    'text-ink-3',
    '已滿員':    'text-ink-3',
    '確認期中':  getStatusTextColor('confirming'),
    '問題處理中': getStatusTextColor('disputed'),
  }[collectionState] ?? 'text-warning-text';

  const isActivated    = ['active', 'cancelled', 'ended'].includes(group.status)

  return (
    <Card
      as="article"
      className="card-lift relative flex min-h-full cursor-pointer flex-col overflow-hidden p-5"
      onClick={onViewGroup}
    >
      <GroupCardHeader
        badge={
          <StatusBadge
            status={displayStatus}
            label={
              group.status === 'full' ? '等待鎖定' :
              group.status === 'pending_confirmation' && isSharedCredentials ? '成員提取中' :
              undefined
            }
          />
        }
        serviceId={group.serviceId}
        serviceName={group.serviceName}
        planName={group.planName}
        pricePerSeat={group.pricePerSeat}
        billingCycle={group.billingCycle}
      />
      <StatCellGrid>
        {group.status === 'active' ? (
          <StatCell label="群組狀態" highlight={collectionHighlight}>
            {collectionState}
          </StatCell>
        ) : isActivated ? (
          <StatCell label="收款紀錄">
            {paymentCount} 件
          </StatCell>
        ) : group.status === 'recruiting' ? (
          <StatCell
            label="待處理申請"
            highlight={pendingAppCount > 0 ? 'text-brand' : undefined}
          >
            {pendingAppCount} 件
          </StatCell>
        ) : (
          <StatCell label="群組狀態" highlight={collectionHighlight}>
            {collectionState}
          </StatCell>
        )}
        <StatCell label="群組人數">
          {members.length + 1} 人
        </StatCell>
        {group.status === 'active' ? (
          <StatCell label="續訂日期">
            {toISODate(group.nextBillingDate, '—')}
          </StatCell>
        ) : group.status === 'recruiting' || group.status === 'cancelled' || group.status === 'ended' ? (
          (<StatCell label="建立日期">
            {group.createdAt ?? '—'}
          </StatCell>)
        ) : isActivated ? (
          <StatCell label="群組狀態" highlight={collectionHighlight}>
            {collectionState}
          </StatCell>
        ) : group.status === 'pending_confirmation' || group.status === 'pending_activation' ? (
          (<StatCell label="預估下次扣款">
            {toISODate(group.nextBillingDate, '—')}
          </StatCell>)
        ) : (
          <StatCell label="下次扣款">
            {toISODate(group.nextBillingDate, '—')}
          </StatCell>
        )}
      </StatCellGrid>
      <div className="mt-auto pt-5">
        <Button
          onClick={e => { e.stopPropagation(); onViewGroup?.() }}
          className="w-full"
        >
          查看群組
        </Button>
      </div>
    </Card>
  );
}

export default memo(HostedGroupCard, (prev, next) =>
  prev.group.id === next.group.id &&
  prev.group.status === next.group.status &&
  prev.group.usedSeats === next.group.usedSeats &&
  prev.group.openSeats === next.group.openSeats &&
  prev.group.nextBillingDate === next.group.nextBillingDate &&
  prev.pendingAppCount === next.pendingAppCount &&
  prev.paymentCount === next.paymentCount &&
  prev.members.length === next.members.length &&
  prev.onViewGroup === next.onViewGroup
)
