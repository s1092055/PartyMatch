const RATING_MARKS = [60, 70, 80, 90]

function RangeSlider({ value, min, max, step, onChange, formatLabel }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="relative pt-1">
      <div className="relative h-1.5 bg-line rounded-full">
        <div
          className="absolute h-full bg-brand rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer h-1.5"
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-400">{formatLabel(min)}</span>
        <span className="text-xs font-bold text-brand">{formatLabel(value)}</span>
        <span className="text-xs text-slate-400">{formatLabel(max)}</span>
      </div>
    </div>
  )
}

export default function PreferenceForm({ conditions, onChange }) {
  const { maxPrice, minRating } = conditions

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-slate-700">預算上限</label>
          <span className="text-sm font-bold text-brand">NT${maxPrice} 以下</span>
        </div>
        <RangeSlider
          value={maxPrice}
          min={50}
          max={500}
          step={10}
          onChange={v => onChange('maxPrice', v)}
          formatLabel={v => `NT$${v}`}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-slate-700">最低信用分數</label>
          <span className="text-sm font-bold text-warning">{minRating} 分以上</span>
        </div>
        <RangeSlider
          value={minRating}
          min={0}
          max={100}
          step={1}
          onChange={v => onChange('minRating', v)}
          formatLabel={v => `${v}`}
        />

        <div className="flex gap-2 mt-3">
          {RATING_MARKS.map(r => (
            <button
              key={r}
              onClick={() => onChange('minRating', r)}
              className={`flex-1 py-1 rounded text-xs font-medium border transition-colors ${
                minRating === r
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-slate-500 border-line hover:border-slate-300'
              }`}
            >
              {r}+
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
