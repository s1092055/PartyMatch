import { Slider as SliderPrimitive } from "radix-ui"
import { cn } from "../../lib/utils"

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
          className="block h-4 w-4 shrink-0 cursor-pointer rounded-full border-2 border-brand bg-white shadow outline-none focus-visible:ring-4 focus-visible:ring-brand-subtle"
        />
      ))}
    </SliderPrimitive.Root>
  )
}
