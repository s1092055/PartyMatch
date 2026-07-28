import { SLIDER_THUMB_DOT, SLIDER_INPUT_POSITION } from './sliderStyles'

// 單一把手的滑桿：整條軌道都能點擊直接跳到該位置，維持原生 range 行為
export default function Slider({ min, max, step = 1, value, onChange, disabled = false, className = '' }) {
  // 夾在 0~100 之間，避免 value 一時超出 min/max 範圍時色塊寬度溢出軌道
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))

  return (
    <div className={`relative pt-1 ${disabled ? 'opacity-40' : ''} ${className}`}>
      <div className="relative h-1.5 rounded-full bg-line">
        <div className="absolute h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
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
    </div>
  )
}
