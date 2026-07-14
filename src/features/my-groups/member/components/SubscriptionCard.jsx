import { memo } from 'react'
import Button from '../../../../shared/ui/Button'
import Badge from '../../../../shared/ui/Badge'
import ServiceLogo from '../../../../shared/ui/ServiceLogo'
import TokenAmount from '../../../../shared/ui/TokenAmount'
import { daysUntil } from '../../../../shared/utils/date'

const STATUS_BADGE_CLASS = {
  active:               'bg-success-subtle text-success-text',
  active_renewal:       'bg-success-subtle text-success-text',
  recruiting:           'bg-success-subtle text-success-text',
  pending_confirmation: 'bg-warning-subtle text-warning-text',
  pending_activation:   'bg-warning-subtle text-warning-text',
  full:                 'bg-slate-100 text-slate-500',
  confirming:           'bg-info-subtle text-info-text',
  disputed:             'bg-danger-subtle text-danger-text',
  cancelled:            'bg-danger-subtle text-danger-text',
  ended:                'bg-slate-100 text-slate-400',
}

function getDisplayStatus(sub) {
  const groupStatus = sub.groupStatus ?? sub.status
  if (groupStatus === 'active' && sub.nextBillingDate) {
    const days = daysUntil(sub.nextBillingDate)
    if (days !== null && days <= 7) return 'active_renewal'
  }
  return groupStatus
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
  const isActive      = sub.status === 'active' || sub.groupStatus === 'active'
  const groupStatus   = sub.groupStatus ?? sub.status
  const displayStatus = getDisplayStatus(sub)
  const memberCount   = sub.usedSeats ?? 0

  return (
    <article
      className="card card-hover group relative flex min-h-full cursor-pointer flex-col overflow-hidden rounded-card border-line bg-surface p-5 shadow-[0_18px_45px_-32px_rgb(20_44_91_/_0.48)] transition-all duration-200"
      onClick={() => onViewGroup?.(sub)}
    >
      <div className="flex justify-center">
        <Badge
          variant={groupStatus === 'recruiting' ? 'member_joined' : groupStatus}
          className={STATUS_BADGE_CLASS[displayStatus] ?? ''}
        />
      </div>

      <div className="mt-4 flex justify-center">
        <ServiceLogo serviceId={sub.serviceId} size={80} className="rounded-logo border-line-strong" />
      </div>

      <div className="mt-3 text-center">
        <h2 className="text-xl font-black leading-tight text-ink">{sub.serviceName}</h2>
        <p className="mt-1 text-sm font-semibold text-ink-3">{sub.planName}</p>
        <p className="mt-1 text-base font-extrabold text-ink">
          <TokenAmount
            amount={sub.billingCycle === 'yearly' ? sub.pricePerSeat * 12 : sub.pricePerSeat}
            cycle={sub.billingCycle === 'yearly' ? 'yearly' : 'monthly'}
          />
        </p>
      </div>

      <div className="my-4 border-t border-line-subtle" />

      <div className="grid grid-cols-3 divide-x divide-line-subtle rounded-lg border border-line-subtle">
        {isActive ? (
          <>
            <StatCell label="下次扣款">{sub.nextBillingDate ?? '—'}</StatCell>
            <StatCell label="團主">{sub.hostName ?? '—'}</StatCell>
            <StatCell label="加入日期">{sub.joinedAt ?? '—'}</StatCell>
          </>
        ) : (
          <>
            <StatCell label="團主">{sub.hostName ?? '—'}</StatCell>
            <StatCell label="成員人數">{memberCount} 人</StatCell>
            <StatCell label="加入日期">{sub.joinedAt ?? '—'}</StatCell>
          </>
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
  prev.sub.nextBillingDate === next.sub.nextBillingDate &&
  prev.onViewGroup === next.onViewGroup
)
