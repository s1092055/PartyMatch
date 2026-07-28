import SliderTrack from './SliderTrack'
import { SLIDER_THUMB_DOT, SLIDER_INPUT_POSITION, clampPct } from './sliderStyles'

// 兩個把手重疊在同一條軌道上時，只讓實際的把手（thumb）可以被點擊拖動，
// 軌道本身不接收點擊，才不會被其中一個 input 整條擋住另一個把手
const RANGE_THUMB_ONLY =
  `pointer-events-none ${SLIDER_INPUT_POSITION} ${SLIDER_THUMB_DOT} ` +
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto'

// 雙把手區間滑桿：valueMin/valueMax 各自獨立拖動，互相夾住不會交叉
export default function RangeSlider({ min, max, step = 1, valueMin, valueMax, onChangeMin, onChangeMax, disabled = false, className = '' }) {
  const minPct = clampPct(((valueMin - min) / (max - min)) * 100)
  const maxPct = clampPct(((valueMax - min) / (max - min)) * 100)

  return (
    <SliderTrack
      disabled={disabled}
      className={className}
      fillStyle={{ left: `${minPct}%`, width: `${Math.max(0, maxPct - minPct)}%` }}
    >
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
    </SliderTrack>
  )
}
