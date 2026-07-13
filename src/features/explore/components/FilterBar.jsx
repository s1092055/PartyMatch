import CategoryPills from '../../../shared/ui/CategoryPills'

export default function FilterBar({ filters, onChange }) {
  return (
    <div className="mb-6 space-y-3">
      <CategoryPills
        variant="grid"
        showAll
        active={filters.category}
        onChange={val => onChange({ category: val === filters.category ? 'all' : val, service: 'all' })}
      />
    </div>
  )
}
