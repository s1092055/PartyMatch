import { useState } from 'react'
import { Check } from 'lucide-react'
import { listServiceTypes } from '../../../shared/services/serviceTypes'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import CategoryPills, { CATEGORIES } from '../../../shared/components/ui/CategoryPills'

const ALL_SERVICES = listServiceTypes()

export default function ServiceSelectionGrid({ selected, onToggle }) {
  const [activeCategory, setActiveCategory] = useState('all')

  const visible = activeCategory === 'all'
    ? ALL_SERVICES
    : ALL_SERVICES.filter(s => s.category === activeCategory)

  return (
    <div>
      <CategoryPills active={activeCategory} onChange={setActiveCategory} className="mb-4" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visible.map(service => {
          const active = selected.includes(service.id)
          return (
            <button
              key={service.id}
              onClick={() => onToggle(service.id)}
              className={`relative flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                active
                  ? 'border-success bg-success-subtle shadow-card'
                  : 'border-line bg-white hover:border-brand-border hover:bg-brand-subtle/40'
              }`}
            >
              {active && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-md bg-success flex items-center justify-center shrink-0">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </span>
              )}
              <ServiceLogo serviceId={service.id} size={40} className="shrink-0" />
              <div>
                <span className="block text-sm font-bold text-ink leading-snug">{service.name}</span>
                <span className="text-xs text-ink-3">{service.category}</span>
              </div>
            </button>
          )
        })}
      </div>
      {visible.length === 0 && (
        <p className="py-6 text-center text-sm text-ink-3">此分類尚無服務</p>
      )}
    </div>
  )
}
