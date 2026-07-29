import SliderTrack from './SliderTrack'

// 雙把手區間滑桿：valueMin/valueMax 各自獨立拖動，Radix 內建防止把手互相交叉
export default function RangeSlider({ min, max, step = 1, valueMin, valueMax, onChangeMin, onChangeMax, disabled = false, className = '' }) {
  return (
    <SliderTrack
      min={min}
      max={max}
      step={step}
      value={[valueMin, valueMax]}
      onValueChange={([newMin, newMax]) => {
        if (newMin !== valueMin) onChangeMin(newMin)
        if (newMax !== valueMax) onChangeMax(newMax)
      }}
      disabled={disabled}
      className={className}
    />
  )
}
