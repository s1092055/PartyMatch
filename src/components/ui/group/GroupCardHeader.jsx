import ServiceLogo from '../ServiceLogo'
import TokenAmount from '../TokenAmount'
import { calcDisplayPrice } from '../../../common/utils/pricingUtils'

export default function GroupCardHeader(
  {
    badge, topLeftSlot, topRightSlot, belowPrice,
    serviceId, serviceName, planName, pricePerSeat, billingCycle,
  }
) {
  return (
    <>
      {topLeftSlot}
      {topRightSlot}

      <div className="flex h-6 items-center justify-center">{badge}</div>

      <div className="mt-3 flex justify-center">
        <ServiceLogo serviceId={serviceId} size={80} className="border-line-strong" />
      </div>

      <div className="mt-3 text-center">
        <h2 className="text-xl font-black leading-tight text-ink">{serviceName}</h2>
        <p className="mt-1 text-sm font-semibold text-ink-3">{planName}</p>
        <p className="mt-3 mb-2 text-xl font-extrabold text-ink">
          <TokenAmount
            amount={calcDisplayPrice(pricePerSeat, billingCycle)}
            unit="/ 位"
            badgeSize="!h-6 !w-6"
            align="uniform"
          />
        </p>
      </div>

      {belowPrice && <div className="mt-3">{belowPrice}</div>}

      <div className={`mb-4 border-t border-line-subtle ${belowPrice ? 'mx-2' : ''}`} />
    </>
  )
}
