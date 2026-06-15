import Badge from '../../../shared/components/ui/Badge'
import Button from '../../../shared/components/ui/Button'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import { effectiveStatus } from '../../../shared/utils/subscriptionStatus'

const STATUS_BADGE_CLASS = {
  pending:             'bg-warning-subtle text-warning-text',
  markedPaid:          'bg-warning-subtle text-warning-text',
  confirmed:           'bg-success-subtle text-success-text',
  paid:                'bg-success-subtle text-success-text',
  waiting_activation:  'bg-brand-subtle text-brand',
  overdue:             'bg-danger-subtle text-danger-text',
}

function StatCell({ label, children, highlight }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2.5 text-center">
      <span className="text-2xs font-bold text-ink-3">{label}</span>
      <span className={`text-sm font-black leading-tight ${highlight ?? 'text-ink'}`}>{children}</span>
    </div>
  )
}

export default function SubscriptionCard({ sub, onViewGroup }) {
  const status = effectiveStatus(sub)
  const isActive = ['confirmed', 'paid'].includes(sub.paymentStatus) || sub.groupStatus === 'active'

  const paymentLabel = {
    pending:            '待付款',
    markedPaid:         '待確認',
    confirmed:          '已確認',
    paid:               '已付款',
    waiting_activation: '等待啟用',
    overdue:            '逾期未付',
  }[status] ?? '待付款'

  const paymentHighlight = {
    pending:   'text-warning-text',
    markedPaid:'text-warning-text',
    overdue:   'text-danger-text',
    confirmed: 'text-success-text',
    paid:      'text-success-text',
  }[status]

  return (
    <article
      className="card card-hover group relative flex min-h-full cursor-pointer flex-col overflow-hidden rounded-card border-line bg-surface p-5 shadow-[0_18px_45px_-32px_rgb(20_44_91_/_0.48)]"
      onClick={() => onViewGroup?.(sub)}
    >
      <div className="flex justify-center">
        <Badge variant={status} className={STATUS_BADGE_CLASS[status] ?? ''} />
      </div>

      <div className="mt-4 flex justify-center">
        <ServiceLogo serviceId={sub.serviceId} size={80} className="rounded-logo border-line-strong" />
      </div>

      <div className="mt-3 text-center">
        <h2 className="text-xl font-black leading-tight text-ink">{sub.serviceName}</h2>
        <p className="mt-1 text-sm font-semibold text-ink-3">{sub.planName}</p>
        <p className="mt-1 text-base font-extrabold text-ink">
          NT${sub.pricePerSeat}
          <span className="ml-1 text-xs font-normal text-ink-4">/席/月</span>
        </p>
      </div>

      <div className="my-4 border-t border-line-subtle" />

      <div className="grid grid-cols-3 divide-x divide-line-subtle rounded-lg border border-line-subtle">
        <StatCell label="付款狀態" highlight={paymentHighlight}>
          {paymentLabel}
        </StatCell>
        <StatCell label={isActive ? '下次扣款' : '加入日期'}>
          {isActive ? (sub.nextBillingDate ?? '—') : (sub.joinedAt ?? '—')}
        </StatCell>
        <StatCell label="團主">
          {sub.hostName ?? '—'}
        </StatCell>
      </div>

      <div className="mt-auto pt-5">
        <Button onClick={e => { e.stopPropagation(); onViewGroup?.(sub) }} className="w-full">
          查看群組
        </Button>
      </div>
    </article>
  )
}
