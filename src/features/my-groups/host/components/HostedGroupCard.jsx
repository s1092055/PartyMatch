import { memo } from 'react'
import Badge from '../../../../shared/ui/primitives/Badge'
import Button from '../../../../shared/ui/primitives/Button'
import ServiceLogo from '../../../../shared/ui/ServiceLogo'
import TokenAmount from '../../../../shared/ui/TokenAmount'
import { getRenewalAwareStatus } from '../../../../shared/utils/groupStatusDisplay'
import { toISODate } from '../../../../shared/utils/date'
import { calcDisplayPrice, calcDisplayCycle } from '../../../../shared/utils/pricingUtils'

function getCollectionState({ group, paidCount, paymentTarget }) {
  if (['cancelled', 'ended'].includes(group.status)) return '已結束'
  if (group.status === 'recruiting') return '招募中'
  if (group.status === 'full') return '等待啟用'
  if (group.status === 'pending_confirmation') return '填寫資訊中'
  if (group.status === 'pending_activation') return '待啟用服務'
  if (group.status === 'confirming') return '確認期中'
  if (group.status === 'disputed') return '申訴中'
  if (paymentTarget > 0 && paidCount < paymentTarget && group.status === 'active') return '追蹤中'
  return '正常'
}

function StatCell({ label, children, onClick, highlight }) {
  const content = (
    <div className="flex flex-col items-center gap-0.5 py-2.5 text-center">
      <span className="text-2xs font-bold text-ink-3">{label}</span>
      <span className={`text-sm font-black leading-tight ${highlight ?? 'text-ink'}`}>{children}</span>
    </div>
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onClick() }}
        className="w-full rounded-lg hover:bg-raised transition-colors"
      >
        {content}
      </button>
    )
  }
  return content
}

function HostedGroupCard({
  group,
  members,
  pendingAppCount,
  paymentCount,
  onViewGroup,
}) {
  const displayStatus = getRenewalAwareStatus(group.status, group.nextBillingDate)

  const collectionState = getCollectionState({ group, paidCount: 0, paymentTarget: members.length })

  const collectionHighlight = {
    '正常':   'text-success-text',
    '招募中': 'text-success-text',
    '已結束': 'text-ink-3',
    '等待啟用': 'text-ink-3',
  }[collectionState] ?? 'text-warning-text'

  const isActivated    = ['active', 'cancelled', 'ended'].includes(group.status)

  return (
    <article
      className="card card-lift relative flex min-h-full cursor-pointer flex-col overflow-hidden rounded-card border-line bg-surface p-5"
      onClick={onViewGroup}
    >
      <div className="flex justify-center">
        <Badge variant={displayStatus} label={group.status === 'pending_confirmation' ? '收款中' : undefined} />
      </div>

      <div className="mt-4 flex justify-center">
        <ServiceLogo serviceId={group.serviceId} size={80} className="rounded-logo border-line-strong" />
      </div>

      <div className="mt-3 text-center">
        <h2 className="text-xl font-black leading-tight text-ink">{group.serviceName}</h2>
        <p className="mt-1 text-sm font-semibold text-ink-3">{group.planName}</p>
        <p className="mt-1 text-base font-extrabold text-ink">
          <TokenAmount
            amount={calcDisplayPrice(group.pricePerSeat, group.billingCycle)}
            cycle={calcDisplayCycle(group.billingCycle)}
          />
        </p>
      </div>

      <div className="my-4 border-t border-line-subtle" />

      <div className="grid grid-cols-3 divide-x divide-line-subtle rounded-lg border border-line-subtle">
        {isActivated ? (
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
          <StatCell label="收款狀態" highlight={collectionHighlight}>
            {collectionState}
          </StatCell>
        )}
        <StatCell label="成員人數">
          {members.length + 1} 人
        </StatCell>
        {group.status === 'recruiting' ? (
          <StatCell label="建立日期">
            {group.createdAt ?? '—'}
          </StatCell>
        ) : isActivated ? (
          <StatCell label="收款狀態" highlight={collectionHighlight}>
            {collectionState}
          </StatCell>
        ) : (
          <StatCell label="下次扣款">
            {toISODate(group.nextBillingDate, '—')}
          </StatCell>
        )}
      </div>

      <div className="mt-auto pt-5">
        <Button
          onClick={e => { e.stopPropagation(); onViewGroup?.() }}
          className="w-full"
        >
          查看群組
        </Button>
      </div>
    </article>
  )
}

export default memo(HostedGroupCard, (prev, next) =>
  prev.group.id === next.group.id &&
  prev.group.status === next.group.status &&
  prev.group.usedSeats === next.group.usedSeats &&
  prev.group.openSeats === next.group.openSeats &&
  prev.pendingAppCount === next.pendingAppCount &&
  prev.paymentCount === next.paymentCount &&
  prev.members.length === next.members.length &&
  prev.onViewGroup === next.onViewGroup
)
