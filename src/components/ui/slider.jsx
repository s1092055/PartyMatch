import { Slider as SliderPrimitive } from "radix-ui"
import { cn } from "../../lib/utils"

// thumb 數量依 value 陣列長度自動決定（1 個值＝單把手，2 個值＝雙把手區間），
// 拖動互不交叉、鍵盤操作、focus 管理都交給 Radix 處理，這裡只負責視覺樣式
export function Slider({ min, max, step, value, onValueChange, disabled, className }) {
  return (
    <SliderPrimitive.Root
      min={min}
      max={max}
      step={step}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      className={cn('relative flex h-4 w-full touch-none select-none items-center pt-1', disabled && 'opacity-40', className)}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-line">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-brand" />
      </SliderPrimitive.Track>
      {value.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block h-4 w-4 shrink-0 cursor-pointer rounded-full border-2 border-brand bg-white shadow focus:outline-none"
        />
      ))}
    </SliderPrimitive.Root>
  )
}
