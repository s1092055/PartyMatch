import SliderTrack from './SliderTrack'

// 單一把手的滑桿
export default function Slider({ min, max, step = 1, value, onChange, disabled = false, className = '' }) {
  return (
    <SliderTrack
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      disabled={disabled}
      className={className}
    />
  )
}
