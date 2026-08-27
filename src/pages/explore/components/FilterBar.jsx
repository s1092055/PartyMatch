import { listServiceTypes } from '../../../shared/services/serviceTypes'
import CustomSelect from '../../../shared/components/ui/CustomSelect'

const SERVICE_FILTERS = [
  { value: 'all', label: '全部服務' },
  ...listServiceTypes().filter(s => ['spotify', 'youtube', 'netflix', 'disney', 'google-one', 'chatgpt'].includes(s.id)),
]

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
  const { keyword, service, joinMode, maxPrice, sortBy } = filters

  return (
    <div className="mb-5">
      <div className="grid grid-cols-2 items-end gap-3 md:flex md:flex-wrap">
        <CustomSelect label="服務類型" value={service} onChange={v => onChange({ service: v })} options={SERVICE_FILTERS} />
        <CustomSelect label="價格範圍（每席）" value={maxPrice} onChange={v => onChange({ maxPrice: v })} options={PRICE_OPTIONS} />
        <CustomSelect label="加入模式" value={joinMode} onChange={v => onChange({ joinMode: v })} options={JOIN_MODE_OPTIONS} />
        <CustomSelect label="排序方式" value={sortBy} onChange={v => onChange({ sortBy: v })} options={SORT_OPTIONS} />
        {keyword && (
          <button
            onClick={() => onChange({ keyword: '' })}
            className="h-11 self-end rounded-lg border border-line bg-white px-4 text-sm font-bold text-ink-2 hover:bg-raised"
          >
            清除搜尋
          </button>
        )}
      </div>
    </div>
  )
}
