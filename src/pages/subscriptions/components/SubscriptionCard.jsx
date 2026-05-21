import Badge from '../../../shared/components/ui/Badge'
import Button from '../../../shared/components/ui/Button'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import { effectiveStatus } from '../../../shared/utils/subscriptionStatus'

export default function SubscriptionCard({ sub, onViewGroup }) {
  const status = effectiveStatus(sub)
  return (
    <article
      className="card card-hover group relative flex min-h-full cursor-pointer flex-col overflow-hidden rounded-card border-line bg-surface p-5 shadow-[0_18px_45px_-32px_rgb(20_44_91_/_0.48)]"
      onClick={() => onViewGroup?.(sub)}
    >
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

      <div className="my-4 border-t border-line-subtle" />

      <div className="flex flex-col items-center justify-center text-center">
        <p className="text-xs font-bold text-ink-3">每月費用</p>
        <p className="mt-0.5 text-2xl font-black leading-none text-ink">
          NT${sub.pricePerSeat}
        </p>
      </div>

      <div className="mt-auto pt-5">
        <Button onClick={e => { e.stopPropagation(); onViewGroup?.(sub) }} className="w-full">
          查看群組
        </Button>
      </div>
    </article>
  )
}
