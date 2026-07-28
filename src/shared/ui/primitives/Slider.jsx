import SliderTrack from './SliderTrack'
import { SLIDER_THUMB_DOT, SLIDER_INPUT_POSITION, clampPct } from './sliderStyles'

// 單一把手的滑桿：整條軌道都能點擊直接跳到該位置，維持原生 range 行為
export default function Slider({ min, max, step = 1, value, onChange, disabled = false, className = '' }) {
  const pct = clampPct(((value - min) / (max - min)) * 100)

  return (
    <SliderTrack disabled={disabled} className={className} fillStyle={{ width: `${pct}%` }}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={e => onChange(Number(e.target.value))}
        className={`${SLIDER_INPUT_POSITION} ${SLIDER_THUMB_DOT}`}
      />
    </SliderTrack>
  )
}
