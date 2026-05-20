import { Check } from 'lucide-react'
import { listServiceTypes } from '../../../shared/services/serviceTypes'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'

const SELECTABLE = listServiceTypes()

export default function ServiceSelectionGrid({ selected, onToggle }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {SELECTABLE.map(service => {
        const active = selected.includes(service.id)
        return (
          <button
            key={service.id}
            onClick={() => onToggle(service.id)}
            className={`relative flex min-h-[5rem] items-center gap-4 rounded-xl border p-4 text-left transition-all ${
              active
                ? 'border-success bg-success-subtle shadow-card'
                : 'border-line bg-white hover:border-brand-border hover:bg-brand-subtle/40'
            }`}
          >
            
            {active && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-md bg-success flex items-center justify-center">
                <Check size={10} className="text-white" strokeWidth={3} />
              </span>
            )}
            <ServiceLogo serviceId={service.id} size={44} />
            <div className="min-w-0">
              <span className="block truncate text-sm font-bold text-ink">{service.name}</span>
              <span className="text-xs text-ink-3">{service.category}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
