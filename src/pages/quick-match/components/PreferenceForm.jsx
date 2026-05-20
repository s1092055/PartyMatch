const JOIN_MODES = [
  { value: 'any',      label: '不限' },
  { value: 'instant',  label: '立即加入' },
  { value: 'approval', label: '審核加入' },
]

const RATING_MARKS = [3.0, 3.5, 4.0, 4.5, 4.8]

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
  const { maxPrice, joinMode, minRating } = conditions

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
        <label className="text-sm font-medium text-slate-700 block mb-3">加入方式</label>
        <div className="flex gap-2">
          {JOIN_MODES.map(m => (
            <button
              key={m.value}
              onClick={() => onChange('joinMode', m.value)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                joinMode === m.value
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-slate-600 border-line hover:border-brand-border'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

<div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-slate-700">最低評分</label>
          <span className="text-sm font-bold text-warning">{minRating} 以上</span>
        </div>
        <RangeSlider
          value={minRating}
          min={3.0}
          max={5.0}
          step={0.1}
          onChange={v => onChange('minRating', v)}
          formatLabel={v => `${v.toFixed(1)}`}
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
