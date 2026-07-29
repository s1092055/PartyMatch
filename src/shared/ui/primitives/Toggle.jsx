import { Switch } from "radix-ui"
import { cn } from "../../../lib/utils"

export default function Toggle({ checked, onChange, ariaLabel }) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-brand' : 'bg-slate-200'
      )}
    >
      <Switch.Thumb
        className={cn(
          'block h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </Switch.Root>
  )
}
