import { getServiceById } from '../../../../shared/utils/serviceUtils'
import ServiceLogo from '../../../../shared/ui/ServiceLogo'
import TokenAmount from '../../../../shared/ui/TokenAmount'

export default function Step2Plans({ conditions, onChangePlan }) {
  return (
    <div>
      <h3 className="text-base font-extrabold text-ink mb-0.5">選擇方案</h3>
      <p className="text-xs text-ink-3 mb-5">為每個服務選擇你想加入的方案</p>
      <div className="space-y-6">
        {conditions.services.map(serviceId => {
          const service = getServiceById(serviceId)
          if (!service) return null
          const selected = conditions.selectedPlans?.[serviceId] ?? 'any'
          return (
            <div key={serviceId}>
              <div className="mb-3 flex items-center gap-2">
                <ServiceLogo serviceId={serviceId} size={24} className="rounded-lg" />
                <p className="text-sm font-extrabold text-ink">{service.name}</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  onClick={() => onChangePlan(serviceId, 'any')}
                  className={`rounded-xl border px-4 py-2.5 text-left transition-colors ${
                    selected === 'any'
                      ? 'border-brand bg-brand-subtle text-brand'
                      : 'border-line bg-surface text-ink-2 hover:border-brand/40 hover:text-ink'
                  }`}
                >
                  <p className="text-sm font-bold">不限方案</p>
                  <p className="text-xs text-ink-4 mt-0.5">接受所有方案</p>
                </button>
                {service.plans.map(plan => (
                  <button
                    key={plan.name}
                    onClick={() => onChangePlan(serviceId, plan.name)}
                    className={`rounded-xl border px-4 py-2.5 text-left transition-colors ${
                      selected === plan.name
                        ? 'border-brand bg-brand-subtle text-brand'
                        : 'border-line bg-surface text-ink-2 hover:border-brand/40 hover:text-ink'
                    }`}
                  >
                    <p className="text-sm font-bold">{plan.name}</p>
                    <p className="text-xs text-ink-4 mt-0.5"><TokenAmount amount={plan.monthlyPrice} cycle="monthly" /> · 最多 {plan.maxSeats} 人</p>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
