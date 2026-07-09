import { useState } from 'react'
import { Check } from 'lucide-react'
import { listServiceTypes } from '../../../../shared/utils/serviceUtils'
import ServiceLogo from '../../../../shared/ui/ServiceLogo'
import CategoryPills from '../../../../shared/ui/CategoryPills'

const ALL_SERVICES = listServiceTypes()

export default function Step1Services({ conditions, onToggle }) {
  const [activeCategory, setActiveCategory] = useState('all')

  const visible = activeCategory === 'all'
    ? ALL_SERVICES
    : ALL_SERVICES.filter(s => s.category === activeCategory)

  return (
    <div>
      <CategoryPills
        variant="grid"
        showAll
        active={activeCategory}
        onChange={setActiveCategory}
        className="mb-3 shrink-0"
      />

      <div className="grid grid-cols-3 gap-3 p-0.5">
        {visible.map(service => {
          const active = conditions.services.includes(service.id)
          return (
            <div
              key={service.id}
              role="button"
              tabIndex={0}
              onClick={() => onToggle(service.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onToggle(service.id)
                }
              }}
              className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                active
                  ? 'border-brand bg-brand-subtle'
                  : 'border-line bg-white hover:border-brand-border hover:bg-brand-subtle/40'
              }`}
            >
              {active && (
                <span className="absolute right-2 top-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </span>
              )}
              <ServiceLogo serviceId={service.id} size={48} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{service.name}</p>
                <p className="text-xs text-slate-400 truncate">{service.category}</p>
              </div>
            </div>
          )
        })}
        {visible.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-ink-3">此分類尚無服務</p>
        )}
      </div>
    </div>
  )
}
