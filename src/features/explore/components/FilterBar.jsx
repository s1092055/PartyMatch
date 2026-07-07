import CategoryPills from '../../../shared/ui/CategoryPills'

export default function FilterBar({ filters, onChange }) {
  return (
    <div className="mb-6">
      <CategoryPills
        variant="grid"
        showAll
        active={filters.category}
        onChange={val => onChange({ category: val, service: 'all' })}
      />
    </div>
  )
}
