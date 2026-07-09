import { getServiceById } from '../../../../shared/utils/serviceUtils'
import ServiceLogo from '../../../../shared/ui/ServiceLogo'
import TokenAmount from '../../../../shared/ui/TokenAmount'
import ScrollHintButton from '../../../../shared/ui/ScrollHintButton'
import { useScrollEdge } from '../../../../shared/utils/hooks'

export default function Step2Plans({ conditions, onChangePlan }) {
  const { scrollRef, atBottom, canScroll, handleScroll, scrollToTop, scrollDown } = useScrollEdge()

  return (
    <div className="relative h-full lg:h-[432px]">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full space-y-8 rounded-xl bg-white p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:overflow-y-auto"
      >
        {conditions.services.map(serviceId => {
          const service = getServiceById(serviceId)
          if (!service) return null
          const selected = conditions.selectedPlans?.[serviceId] ?? 'any'
          return (
            <div key={serviceId}>
              <div className="mb-3 flex items-center gap-2">
                <ServiceLogo serviceId={serviceId} size={24} className="rounded-lg" />
                <p className="text-base font-medium text-slate-700">{service.name}</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  onClick={() => onChangePlan(serviceId, 'any')}
                  className={`rounded-xl border-2 px-4 py-2.5 text-left transition-colors ${
                    selected === 'any'
                      ? 'border-brand bg-brand-subtle text-brand'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-bold">不限方案</p>
                  <p className="mt-0.5 text-xs text-slate-400">接受所有方案</p>
                </button>
                {service.plans.map(plan => (
                  <button
                    key={plan.name}
                    onClick={() => onChangePlan(serviceId, plan.name)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-left transition-colors ${
                      selected === plan.name
                        ? 'border-brand bg-brand-subtle text-brand'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-bold">{plan.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400"><TokenAmount amount={plan.monthlyPrice} cycle="monthly" /> · 最多 {plan.maxSeats} 人</p>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <ScrollHintButton canScroll={canScroll} atBottom={atBottom} onScrollToTop={scrollToTop} onScrollDown={scrollDown} />
    </div>
  )
}
