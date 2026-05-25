import { useMemo } from 'react'
import { listServiceTypes } from '../../../shared/services/serviceTypes'
import CustomSelect from '../../../shared/components/ui/CustomSelect'
import CategoryPills from '../../../shared/components/ui/CategoryPills'

const PRICE_OPTIONS = [
  { value: 'any',  label: '不限價格' },
  { value: '100',  label: 'NT$100 以下' },
  { value: '150',  label: 'NT$150 以下' },
  { value: '200',  label: 'NT$200 以下' },
]

const JOIN_MODE_OPTIONS = [
  { value: 'all',      label: '所有方式' },
  { value: 'instant',  label: '立即加入' },
  { value: 'approval', label: '審核加入' },
]

const SORT_OPTIONS = [
  { value: 'recommended', label: '最新上架' },
  { value: 'rating',      label: '評分最高' },
  { value: 'price_asc',   label: '價格最低' },
  { value: 'seats',       label: '名額快滿' },
]

export default function FilterBar({ filters, onChange }) {
  const { category, service, joinMode, maxPrice, sortBy } = filters

  const serviceOptions = useMemo(() => {
    const all = listServiceTypes()
    const pool = category === 'all' ? all : all.filter(s => s.category === category)
    return [
      { value: 'all', label: '所有服務' },
      ...pool.map(s => ({ value: s.id, label: s.name })),
    ]
  }, [category])

  return (
    <div className="mb-6 space-y-4">
      <CategoryPills
        variant="grid"
        active={category}
        onChange={val => onChange({ category: val, service: 'all' })}
      />

      <div className="flex flex-wrap gap-4 mt-6">
        <CustomSelect value={service} onChange={v => onChange({ service: v })} options={serviceOptions} />
        <CustomSelect value={joinMode} onChange={v => onChange({ joinMode: v })} options={JOIN_MODE_OPTIONS} />
        <CustomSelect value={maxPrice} onChange={v => onChange({ maxPrice: v })} options={PRICE_OPTIONS} />
        <CustomSelect value={sortBy} onChange={v => onChange({ sortBy: v })} options={SORT_OPTIONS} />
      </div>
    </div>
  )
}
