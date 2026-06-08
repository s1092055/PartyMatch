import { useState } from 'react'
import { Check } from 'lucide-react'
import { listServiceTypes } from '../../../../shared/services/serviceTypes'
import ServiceLogo from '../../../../shared/components/ui/ServiceLogo'
import CategoryPills from '../../../../shared/components/ui/CategoryPills'

const ALL_SERVICES = listServiceTypes()

export default function Step1Service({ form, onChange }) {
  const [activeCategory, setActiveCategory] = useState(
    () => ALL_SERVICES.find(s => s.id === form.serviceId)?.category ?? '影音'
  )

  const visible = ALL_SERVICES.filter(s => s.category === activeCategory)

  return (
    <div>
      <h2 className="mb-4 text-base font-extrabold text-ink">選擇訂閱服務（單選）</h2>

      <CategoryPills active={activeCategory} onChange={setActiveCategory} className="mb-3" />

      <div className="overflow-y-auto pr-1 pt-1" style={{ maxHeight: '320px' }}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {visible.map(service => {
          const active = form.serviceId === service.id
          return (
            <button
              key={service.id}
              onClick={() => onChange('serviceId', service.id)}
              className={`relative flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                active
                  ? 'border-success bg-success-subtle'
                  : 'border-line bg-white hover:border-brand-border hover:bg-brand-subtle/40'
              }`}
            >
              {active && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-md bg-success flex items-center justify-center">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </span>
              )}
              <ServiceLogo serviceId={service.id} size={44} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{service.name}</p>
                <p className="text-xs text-slate-400">{service.category}</p>
              </div>
            </button>
          )
        })}
        {visible.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-ink-3">此分類尚無服務</p>
        )}
      </div>
      </div>

    </div>
  )
}
