import { useState } from 'react'
import PriceRangeAmount from '../../../../components/ui/PriceRangeAmount'
import { Slider } from '../../../../components/ui/slider'
import { formatPriceRangeLabel } from '../../utils/priceRangeLabel'
import { PRICE_MIN, DEFAULT_PRICE_MAX, PRICE_MAX_CAP } from '../../utils/priceRangeDefaults'

const RATING_MARKS = [60, 70, 80, 90]

function activeRatingMark(minRating) {
  if (minRating <= 0) return null
  return RATING_MARKS.reduce((closest, mark) => (mark <= minRating ? mark : closest), null)
}

export default function Step3Filters({ conditions, onChange }) {
  const isUnlimitedPrice = conditions.minPrice == null && conditions.maxPrice == null
  const [rangeMin, setRangeMin] = useState(conditions.minPrice ?? PRICE_MIN);
  const [rangeMax, setRangeMax] = useState(conditions.maxPrice ?? DEFAULT_PRICE_MAX)
  const [priceMax, setPriceMax] = useState(Math.max(DEFAULT_PRICE_MAX, rangeMax))

  const curMin = conditions.minPrice ?? rangeMin
  const curMax = conditions.maxPrice ?? rangeMax
  const priceMinInput = String(curMin);
  const priceMaxInput = String(curMax)
  const priceLabel = formatPriceRangeLabel(conditions.minPrice, conditions.maxPrice)

  function toggleUnlimitedPrice(checked) {
    if (checked) {
      onChange('minPrice', null)
      onChange('maxPrice', null)
    } else {
      onChange('minPrice', rangeMin)
      onChange('maxPrice', rangeMax)
    }
  }

  function handleMinDrag(value) {
    const clamped = Math.min(value, conditions.maxPrice ?? rangeMax)
    setRangeMin(clamped)
    onChange('minPrice', clamped)
  }

  function handleMaxDrag(value) {
    const clamped = Math.max(value, conditions.minPrice ?? rangeMin)
    setRangeMax(clamped)
    onChange('maxPrice', clamped)
  }

  function applyMaxLimit(clamped) {
    setPriceMax(clamped)
    setRangeMax(clamped)
    onChange('maxPrice', clamped)
    if ((conditions.minPrice ?? rangeMin) > clamped) {
      setRangeMin(clamped)
      onChange('minPrice', clamped)
    }
  }

  function applyPriceScale(raw) {
    if (!raw) { applyMaxLimit(DEFAULT_PRICE_MAX); return }
    const num = Number(raw)
    if (!Number.isFinite(num)) return
    applyMaxLimit(Math.min(PRICE_MAX_CAP, Math.max(PRICE_MIN, Math.round(num))))
  }

  function commitPriceScaleInput(raw) {
    if (!raw) { applyMaxLimit(DEFAULT_PRICE_MAX); return }
    const num = Number(raw)
    if (!Number.isFinite(num)) { applyMaxLimit(DEFAULT_PRICE_MAX); return }
    applyMaxLimit(Math.min(PRICE_MAX_CAP, Math.max(PRICE_MIN + 10, Math.round(num))))
  }

  function applyMinLimit(clamped) {
    const finalMin = Math.min(clamped, conditions.maxPrice ?? rangeMax)
    setRangeMin(finalMin)
    onChange('minPrice', finalMin)
    return finalMin
  }

  function applyPriceMinInput(raw) {
    if (!raw) { applyMinLimit(PRICE_MIN); return }
    const num = Number(raw)
    if (!Number.isFinite(num)) return
    applyMinLimit(Math.min(PRICE_MAX_CAP, Math.max(PRICE_MIN, Math.round(num))))
  }

  function commitPriceMinInput(raw) {
    if (!raw) { applyMinLimit(PRICE_MIN); return }
    const num = Number(raw)
    if (!Number.isFinite(num)) { applyMinLimit(PRICE_MIN); return }
    applyMinLimit(Math.min(PRICE_MAX_CAP, Math.max(PRICE_MIN, Math.round(num))))
  }

  return (
    <div className="space-y-10">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-base font-medium text-ink-2">申請費用/人</span>
          <PriceRangeAmount
            label={isUnlimitedPrice ? null : priceLabel}
            className="text-sm font-bold text-brand"
            unlimitedClassName="text-sm font-normal text-ink-4"
          />
        </div>
        <Slider
          min={PRICE_MIN} max={priceMax} step={1}
          value={[curMin, curMax]}
          onValueChange={([newMin, newMax]) => {
            if (newMin !== curMin) handleMinDrag(newMin)
            if (newMax !== curMax) handleMaxDrag(newMax)
          }}
          disabled={isUnlimitedPrice}
        />
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="w-36 rounded-lg border border-line bg-surface px-1.5 py-0.5 transition-[box-shadow] focus-within:ring-4 focus-within:ring-brand-subtle has-[:disabled]:opacity-50">
            <input
              type="text"
              inputMode="numeric"
              placeholder="請輸入最低金額"
              disabled={isUnlimitedPrice}
              value={priceMinInput}
              onChange={e => applyPriceMinInput(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={e => commitPriceMinInput(e.target.value)}
              className="w-full bg-transparent text-center text-xs text-ink-4 outline-none"
            />
          </span>
          <span className="w-36 rounded-lg border border-line bg-surface px-1.5 py-0.5 transition-[box-shadow] focus-within:ring-4 focus-within:ring-brand-subtle has-[:disabled]:opacity-50">
            <input
              type="text"
              inputMode="numeric"
              placeholder="請輸入最高上限"
              disabled={isUnlimitedPrice}
              value={priceMaxInput}
              onChange={e => applyPriceScale(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={e => commitPriceScaleInput(e.target.value)}
              className="w-full bg-transparent text-center text-xs text-ink-4 outline-none"
            />
          </span>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-ink-4">
          <input
            type="checkbox"
            checked={isUnlimitedPrice}
            onChange={e => toggleUnlimitedPrice(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-line-strong accent-brand focus:outline-none"
          />
          不限
        </label>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-base font-medium text-ink-2">團主信用分數</span>
          <span className="text-sm font-bold text-brand">{conditions.minRating > 0 ? `${conditions.minRating} 分以上` : '不限'}</span>
        </div>
        <Slider min={0} max={100} step={1} value={[conditions.minRating]} onValueChange={([v]) => onChange('minRating', v)} />
        <div className="mt-4 flex justify-between">
          <span className="text-xs text-ink-4">0</span>
          <span className="text-xs text-ink-4">100</span>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onChange('minRating', 0)}
            className={`flex-1 rounded-lg border-2 py-2.5 text-sm font-medium transition-colors ${
              conditions.minRating === 0
                ? 'border-brand bg-brand-subtle text-brand'
                : 'border-line bg-surface text-ink-2 hover:border-line-strong'
            }`}
          >
            不限
          </button>
          {RATING_MARKS.map(r => (
            <button
              key={r}
              onClick={() => onChange('minRating', r)}
              className={`flex-1 rounded-lg border-2 py-2.5 text-sm font-medium transition-colors ${
                activeRatingMark(conditions.minRating) === r
                  ? 'border-brand bg-brand-subtle text-brand'
                  : 'border-line bg-surface text-ink-2 hover:border-line-strong'
              }`}
            >
              {r}+
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="mb-3 block text-base font-medium text-ink-2">群組年資</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '不限',         value: 'any' },
            { label: '三個月內',     value: 'new' },
            { label: '三個月至一年', value: 'established' },
            { label: '一年以上',     value: 'veteran' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange('groupAge', opt.value)}
              className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                conditions.groupAge === opt.value
                  ? 'border-brand bg-brand-subtle text-brand'
                  : 'border-line bg-surface text-ink-2 hover:border-line-strong'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
