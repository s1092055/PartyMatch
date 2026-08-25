import logoUrl from '../../../assets/Logo.svg'
import { CATEGORIES } from '../../../common/data/serviceCategories'

const ALL_ITEM = { value: 'all', label: '全部', Icon: null }

export default function CategoryPills({ active, onChange, variant = 'pills', showAll = false, fullHeight = false, className = '', innerRef = null }) {
  const items = showAll ? [ALL_ITEM, ...CATEGORIES] : CATEGORIES

  if (variant === 'grid') {
    const cols = showAll ? 'md:grid-cols-10' : 'md:grid-cols-9'
    return (
      <div className={`flex gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid ${cols} md:overflow-visible md:py-0 ${className}`}>
        {items.map(cat => {
          const isActive = active === cat.value
          return (
            <button
              key={cat.value}
              onClick={() => onChange(cat.value)}
              className={`flex shrink-0 w-20 flex-col items-center justify-center gap-1 rounded-lg py-3.5 text-xs font-bold transition-all md:w-full md:gap-2 md:py-4 ${
                isActive
                  ? 'bg-raised text-ink md:scale-105'
                  : 'bg-transparent text-ink-2 hover:text-ink md:hover:scale-105 md:hover:bg-raised md:hover:text-ink'
              }`}
            >
              {cat.value === 'all' ? (
                <img src={logoUrl} alt="全部" className="h-6 w-6 rounded-lg object-contain md:h-8 md:w-8" />
              ) : cat.Icon && (
                <>
                  <cat.Icon size={24} className="md:hidden" strokeWidth={1.5} />
                  <cat.Icon size={28} className="hidden md:block" strokeWidth={1.5} />
                </>
              )}
              <span className="text-2xs md:text-sm">{cat.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col gap-1.5 ${fullHeight ? 'h-full' : 'py-0.5 px-0.5 gap-0.5'} ${className}`}>
        {items.map(cat => {
          const isActive = active === cat.value
          return (
            <button
              key={cat.value}
              onClick={() => onChange(cat.value)}
              className={`flex w-full items-center gap-2.5 rounded-lg font-bold transition-colors ${
                fullHeight ? 'flex-1 px-3 text-sm' : 'gap-2 px-2.5 py-2 text-xs'
              } ${
                isActive
                  ? 'bg-raised text-ink'
                  : 'bg-transparent text-ink-2 hover:bg-raised hover:text-ink'
              }`}
            >
              {cat.value === 'all'
                ? <img src={logoUrl} alt="全部" className={`${fullHeight ? 'h-5 w-5' : 'h-[13px] w-[13px]'} shrink-0 rounded object-contain`} />
                : cat.Icon && <cat.Icon size={fullHeight ? 20 : 13} strokeWidth={1.5} className="shrink-0" />
              }
              <span className="truncate">{cat.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div ref={innerRef} className={`flex gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
      {items.map(cat => {
        const isActive = active === cat.value
        return (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold transition-colors ${
              isActive
                ? 'bg-raised text-ink'
                : 'bg-transparent text-ink-2 hover:bg-raised hover:text-ink'
            }`}
          >
            {cat.value === 'all'
              ? <img src={logoUrl} alt="全部" className="h-[13px] w-[13px] shrink-0 rounded object-contain" />
              : cat.Icon && <cat.Icon size={13} strokeWidth={1.5} className="shrink-0" />
            }
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
