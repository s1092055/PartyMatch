import TokenAmount from '../../../../shared/ui/TokenAmount'

const RATING_MARKS = [60, 70, 80, 90]

export default function Step3Filters({ conditions, onChange }) {
  const pricePct = ((conditions.maxPrice - 50) / (500 - 50)) * 100
  return (
    <div>
      <h3 className="text-base font-extrabold text-ink mb-0.5">篩選條件</h3>
      <p className="text-xs text-ink-3 mb-5">選填，不填寫也可以直接開始配對</p>
      <div className="space-y-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-bold text-ink">預算上限</label>
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
              <span className="text-xs text-ink-4"><TokenAmount amount={50} /></span>
              <span className="text-xs text-ink-4"><TokenAmount amount={500} /></span>
            </div>
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-bold text-ink">最低信用分數</label>
            <span className="text-sm font-bold text-warning">{conditions.minRating} 分以上</span>
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
                className={`flex-1 rounded py-1 text-xs font-medium border transition-colors ${
                  conditions.minRating === r
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-ink-3 border-line hover:border-slate-300'
                }`}
              >
                {r}+
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold text-ink">群組年資</p>
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
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  conditions.groupAge === opt.value
                    ? 'border-brand bg-brand-subtle text-brand'
                    : 'border-line bg-surface text-ink-2 hover:border-brand/40 hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
