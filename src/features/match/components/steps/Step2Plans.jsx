import { getServiceById } from '../../../../common/utils/serviceUtils'
import ServiceLogo from '../../../../components/ui/ServiceLogo'
import TokenAmount from '../../../../components/ui/TokenAmount'
import { resolvePlanDisplayPrice } from '../../../../common/utils/resolvePlanDisplayPrice'
import { useUsdToTwdRate } from '../../../../common/utils/exchangeRate'

export default function Step2Plans({ conditions, onChangePlan }) {
  const usdToTwdRate = useUsdToTwdRate()
  return (
    <div className="space-y-8">
      {conditions.services.map(serviceId => {
        const service = getServiceById(serviceId)
        if (!service) return null
        const selected = conditions.selectedPlans?.[serviceId] ?? 'any'
        return (
          <div key={serviceId}>
            <div className="mb-3 flex items-center gap-2">
              <ServiceLogo serviceId={serviceId} size={24} />
              <p className="text-base font-medium text-ink-2">{service.name}</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                onClick={() => onChangePlan(serviceId, 'any')}
                className={`rounded-xl border-2 px-4 py-2.5 text-left transition-colors ${
                  selected === 'any'
                    ? 'border-brand bg-brand-subtle text-brand'
                    : 'border-line bg-surface text-ink-2 hover:border-line-strong'
                }`}
              >
                <p className="text-sm font-bold">不限方案</p>
                <p className="mt-0.5 text-xs text-ink-4">接受所有方案</p>
              </button>
              {service.plans.map(plan => {
                const { amount, cycle } = resolvePlanDisplayPrice(plan, usdToTwdRate)
                return (
                  <button
                    key={plan.name}
                    onClick={() => onChangePlan(serviceId, plan.name)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-left transition-colors ${
                      selected === plan.name
                        ? 'border-brand bg-brand-subtle text-brand'
                        : 'border-line bg-surface text-ink-2 hover:border-line-strong'
                    }`}
                  >
                    <p className="text-sm font-bold">{plan.name}</p>
                    <p className="mt-0.5 text-xs text-ink-4"><TokenAmount amount={amount} cycle={cycle} badgeSize="!h-3 !w-3" /> · 最多 {plan.maxSeats} 人</p>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
