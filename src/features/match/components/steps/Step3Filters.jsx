import TokenAmount from '../../../../shared/ui/TokenAmount'

const RATING_MARKS = [60, 70, 80, 90]

export default function Step3Filters({ conditions, onChange }) {
  const pricePct = ((conditions.maxPrice - 50) / (500 - 50)) * 100
  return (
    <div className="space-y-10">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="text-base font-medium text-slate-700">預算上限</label>
          <span className="text-sm font-bold text-brand"><TokenAmount amount={conditions.maxPrice} /> 以下</span>
        </div>
        <div className="relative pt-1">
          <div className="relative h-1.5 rounded-full bg-line">
            <div className="absolute h-full rounded-full bg-brand" style={{ width: `${pricePct}%` }} />
          </div>
          <input
            type="range" min={50} max={500} step={10} value={conditions.maxPrice}
            onChange={e => onChange('maxPrice', Number(e.target.value))}
            className="absolute inset-0 h-1.5 w-full cursor-pointer opacity-0"
          />
          <div className="mt-1 flex justify-between">
            <span className="text-xs text-ink-4">50</span>
            <span className="text-xs text-ink-4">500</span>
          </div>
        </div>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="text-base font-medium text-slate-700">信用分數</label>
          <span className="text-sm font-bold text-brand">{conditions.minRating} 分以上</span>
        </div>
        <div className="relative pt-1">
          <div className="relative h-1.5 rounded-full bg-line">
            <div className="absolute h-full rounded-full bg-brand" style={{ width: `${conditions.minRating}%` }} />
          </div>
          <input
            type="range" min={0} max={100} step={1} value={conditions.minRating}
            onChange={e => onChange('minRating', Number(e.target.value))}
            className="absolute inset-0 h-1.5 w-full cursor-pointer opacity-0"
          />
          <div className="mt-1 flex justify-between">
            <span className="text-xs text-ink-4">0</span>
            <span className="text-xs text-ink-4">100</span>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {RATING_MARKS.map(r => (
            <button
              key={r}
              onClick={() => onChange('minRating', r)}
              className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-medium transition-colors ${
                conditions.minRating === r
                  ? 'border-brand bg-brand-subtle text-brand'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {r}+
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-3 block text-base font-medium text-slate-700">群組年資</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: '不限',         value: 'any' },
            { label: '三個月內',     value: 'new' },
            { label: '三個月至一年', value: 'established' },
            { label: '一年以上',     value: 'veteran' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange('groupAge', opt.value)}
              className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                conditions.groupAge === opt.value
                  ? 'border-brand bg-brand-subtle text-brand'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
