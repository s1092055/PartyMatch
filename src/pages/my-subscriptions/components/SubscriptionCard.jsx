import { BadgeCheck, Calendar } from 'lucide-react'
import Avatar from '../../../shared/components/ui/Avatar'
import Badge from '../../../shared/components/ui/Badge'
import Button from '../../../shared/components/ui/Button'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import { effectiveStatus } from '../../../shared/utils/subscriptionStatus'
import { daysUntil, formatMonthDay } from '../../../shared/utils/date'

const PAYMENT_STATUS_LABEL = {
  pending:            { label: '待付款',   cls: 'text-warning-text' },
  overdue:            { label: '逾期未付', cls: 'text-danger'       },
  markedPaid:         { label: '待確認',   cls: 'text-brand'        },
  confirmed:          { label: '已確認',   cls: 'text-success-text' },
  waiting_activation: { label: '待啟用',   cls: 'text-ink-3'        },
  paid:               { label: '已付款',   cls: 'text-success-text' },
}

export default function SubscriptionCard({ sub, onViewGroup }) {
  const status = effectiveStatus(sub)
  const paymentInfo = PAYMENT_STATUS_LABEL[status] ?? PAYMENT_STATUS_LABEL.pending

  const daysLeft = daysUntil(sub.nextBillingDate)
  const isUpcoming = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7
  const billingLabel = sub.billingCycle === 'yearly' ? '年付' : '月付'

  return (
    <article className="card relative flex flex-col overflow-hidden p-5">
      <div className="flex justify-center">
        <Badge variant={status} />
      </div>

      <div className="mt-4 flex justify-center">
        <ServiceLogo serviceId={sub.serviceId} size={80} className="rounded-logo border-line-strong" />
      </div>

      <div className="mt-3 text-center">
        <h2 className="text-xl font-black leading-tight text-ink">{sub.serviceName}</h2>
        <p className="mt-1 text-base font-semibold text-ink-3">{sub.planName}</p>
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-line px-2.5 py-1 text-xs font-extrabold text-ink-3">
          {billingLabel}
        </span>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${isUpcoming ? 'bg-warning-subtle text-warning-text' : 'bg-line text-ink-3'}`}>
          <Calendar size={12} strokeWidth={2.25} />
          {formatMonthDay(sub.nextBillingDate)}
        </span>
      </div>

      <div className="my-4 border-t border-line-subtle" />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar
            initial={sub.hostAvatarInitial}
            color={sub.hostAvatarColor ?? '#94A3B8'}
            size="md"
            className="border-2 border-white shadow-sm"
          />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1">
              <span className="truncate text-sm font-black text-ink">{sub.hostName}</span>
              {sub.isHostVerified && <BadgeCheck size={14} className="shrink-0 fill-brand text-white" />}
            </div>
            <p className="mt-0.5 text-xs text-ink-3">團主</p>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold text-ink-3">付款狀態</p>
          <p className={`mt-0.5 text-sm font-black ${paymentInfo.cls}`}>{paymentInfo.label}</p>
          {isUpcoming && (
            <p className="mt-0.5 text-xs text-warning-text">
              {daysLeft === 0 ? '今天扣款' : `${daysLeft} 天後扣款`}
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-5">
        <p className="mb-3 text-center text-2xl font-black leading-none text-ink">
          NT${sub.pricePerSeat}
          <span className="ml-1 text-sm font-semibold text-ink-3">/ 月</span>
        </p>
        <Button variant="ink" onClick={() => onViewGroup?.(sub)} className="w-full">
          查看群組
        </Button>
      </div>
    </article>
  )
}
