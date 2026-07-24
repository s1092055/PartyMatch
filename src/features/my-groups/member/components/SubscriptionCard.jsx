import { memo } from 'react'
import Button from '../../../../shared/ui/primitives/Button'
import Badge from '../../../../shared/ui/primitives/Badge'
import ServiceLogo from '../../../../shared/ui/ServiceLogo'
import TokenAmount from '../../../../shared/ui/TokenAmount'
import { toISODate } from '../../../../shared/utils/date'
import { isEffectivelyActive } from '../../../../shared/utils/groupStatus'
import { getRenewalAwareStatus } from '../../../../shared/utils/groupStatusDisplay'
import { calcDisplayPrice, calcDisplayCycle } from '../../../../shared/utils/pricingUtils'

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

  return (
    <article
      className="card card-lift relative flex min-h-full cursor-pointer flex-col overflow-hidden rounded-card border-line bg-surface p-5"
      onClick={() => onViewGroup?.(sub)}
    >
      <div className="flex justify-center">
        <Badge variant={displayStatus === 'recruiting' ? 'member_joined' : displayStatus} />
      </div>

      <div className="mt-4 flex justify-center">
        <ServiceLogo serviceId={sub.serviceId} size={80} className="rounded-logo border-line-strong" />
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
        <StatCell label="成員人數">{memberCount} 人</StatCell>
        {isActive ? (
          <StatCell label="下次扣款">{toISODate(sub.nextBillingDate, '—')}</StatCell>
        ) : (
          <StatCell label="加入日期">{sub.joinedAt ?? '—'}</StatCell>
        )}
      </div>

      <div className="mt-auto pt-5">
        <Button onClick={e => { e.stopPropagation(); onViewGroup?.(sub) }} className="w-full">
          查看群組
        </Button>
      </div>
    </article>
  )
}

export default memo(SubscriptionCard, (prev, next) =>
  prev.sub.id === next.sub.id &&
  prev.sub.groupStatus === next.sub.groupStatus &&
  prev.sub.confirmedAt === next.sub.confirmedAt &&
  prev.sub.nextBillingDate === next.sub.nextBillingDate &&
  prev.onViewGroup === next.onViewGroup
)
