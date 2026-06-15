import { useState } from 'react'
import { Check } from 'lucide-react'
import { listServiceTypes } from '../../../shared/utils/serviceUtils'
import ServiceLogo from '../../../shared/ui/ServiceLogo'
import CategoryPills from '../../../shared/ui/CategoryPills'

const ALL_SERVICES = listServiceTypes()

export default function ServiceSelectionGrid({ selected, onToggle }) {
  const [activeCategory, setActiveCategory] = useState('all')

  const visible = activeCategory === 'all'
    ? ALL_SERVICES
    : ALL_SERVICES.filter(s => s.category === activeCategory)

  return (
    <div>
      {/* Mobile: horizontal pills */}
      <CategoryPills
        showAll
        active={activeCategory}
        onChange={setActiveCategory}
        className="mb-3 lg:hidden"
      />

      <div className="lg:flex lg:items-start lg:gap-4">
        {/* Desktop: vertical sidebar */}
        <CategoryPills
          variant="vertical"
          showAll
          active={activeCategory}
          onChange={setActiveCategory}
          className="hidden lg:flex w-[130px] shrink-0 max-h-[320px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        />

        <div
          className="flex-1 overflow-y-auto pr-1 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ maxHeight: '320px' }}
        >
          <div className="grid grid-cols-2 gap-3">
            {visible.map(service => {
              const isActive = selected.includes(service.id)
              return (
                <button
                  key={service.id}
                  onClick={() => onToggle(service.id)}
                  className={`relative flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                    isActive
                      ? 'border-success bg-success-subtle shadow-card'
                      : 'border-line bg-white hover:border-brand-border hover:bg-brand-subtle/40'
                  }`}
                >
                  {isActive && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-success">
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                  <ServiceLogo serviceId={service.id} size={40} className="shrink-0" />
                  <div>
                    <span className="block text-sm font-bold leading-snug text-ink">{service.name}</span>
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
      </div>
    </div>
  )
}
