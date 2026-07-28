import { SLIDER_THUMB_DOT, SLIDER_INPUT_POSITION } from './sliderStyles'

// 兩個把手重疊在同一條軌道上時，只讓實際的把手（thumb）可以被點擊拖動，
// 軌道本身不接收點擊，才不會被其中一個 input 整條擋住另一個把手
const RANGE_THUMB_ONLY =
  `pointer-events-none ${SLIDER_INPUT_POSITION} ${SLIDER_THUMB_DOT} ` +
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto'

// 雙把手區間滑桿：valueMin/valueMax 各自獨立拖動，互相夾住不會交叉
export default function RangeSlider({ min, max, step = 1, valueMin, valueMax, onChangeMin, onChangeMax, disabled = false, className = '' }) {
  // 夾在 0~100 之間：min/max 邊界調整時（例如打字調整刻度上限途中）數值可能暫時超出範圍，
  // 沒有夾住的話色塊寬度會算出超過 100%，視覺上就會整條溢出到軌道右邊外面
  const clampPct = pct => Math.min(100, Math.max(0, pct))
  const minPct = clampPct(((valueMin - min) / (max - min)) * 100)
  const maxPct = clampPct(((valueMax - min) / (max - min)) * 100)

  return (
    <div className={`relative pt-1 ${disabled ? 'opacity-40' : ''} ${className}`}>
      <div className="relative h-1.5 rounded-full bg-line">
        <div className="absolute h-full rounded-full bg-brand" style={{ left: `${minPct}%`, width: `${Math.max(0, maxPct - minPct)}%` }} />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMin}
        disabled={disabled}
        onChange={e => onChangeMin(Math.min(Number(e.target.value), valueMax))}
        className={RANGE_THUMB_ONLY}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMax}
        disabled={disabled}
        onChange={e => onChangeMax(Math.max(Number(e.target.value), valueMin))}
        className={RANGE_THUMB_ONLY}
      />
    </div>
  )
}
