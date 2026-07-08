import CategoryPills from '../../../shared/ui/CategoryPills'
import CustomSelect from '../../../shared/ui/CustomSelect'
import { DEFAULT_FILTERS, PRICE_OPTIONS, SORT_OPTIONS } from '../exploreConstants'

export default function FilterBar({ filters, onChange }) {
  const hasActiveFilters = filters.maxPrice !== DEFAULT_FILTERS.maxPrice || filters.sortBy !== DEFAULT_FILTERS.sortBy

  return (
    <div className="mb-6 space-y-3">
      <CategoryPills
        variant="grid"
        showAll
        active={filters.category}
        onChange={val => onChange({ category: val === filters.category ? 'all' : val, service: 'all' })}
      />

      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-2 md:max-w-xs">
          <CustomSelect
            value={filters.maxPrice}
            onChange={v => onChange({ maxPrice: v })}
            options={PRICE_OPTIONS}
          />
          <CustomSelect
            value={filters.sortBy}
            onChange={v => onChange({ sortBy: v })}
            options={SORT_OPTIONS}
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => onChange({ maxPrice: DEFAULT_FILTERS.maxPrice, sortBy: DEFAULT_FILTERS.sortBy })}
            className="shrink-0 text-xs font-bold text-brand hover:text-brand-hover"
          >
            清除篩選
          </button>
        )}
      </div>
    </div>
  )
}
