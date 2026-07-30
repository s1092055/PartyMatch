import { Select } from "radix-ui"
import { Check, ChevronDown } from 'lucide-react'
import { cn } from "../../../lib/utils"

export default function CustomSelect({ label, value, onChange, options, className }) {
  const selectedOption = options.find(o => (o.value ?? o.id) === value)

  return (
    <div className={cn('relative min-w-0 flex-1', className)}>
      {label && (
        <span className="mb-1 block text-2xs font-medium text-ink-3 text-center md:text-left">{label}</span>
      )}
      <Select.Root value={value} onValueChange={onChange}>
        <Select.Trigger className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-surface px-3 text-sm font-bold text-ink transition-colors outline-none focus-visible:border-brand-border data-[placeholder]:text-ink-3">
          <Select.Value className="flex flex-1 items-center gap-2 truncate text-left">
            {selectedOption?.icon}
            <span className="truncate">{selectedOption?.label ?? selectedOption?.name}</span>
          </Select.Value>
          <Select.Icon className="shrink-0">
            <ChevronDown size={15} strokeWidth={1.5} className="text-ink-3" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className="relative z-50 max-h-[var(--radix-select-content-available-height)] min-w-36 max-w-[min(20rem,90vw)] origin-[var(--radix-select-content-transform-origin)] overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
          >
            <Select.Viewport className="max-h-60 overflow-y-auto scrollbar-none p-1">
              {options.map(o => {
                const val = o.value ?? o.id
                return (
                  <Select.Item
                    key={val}
                    value={val}
                    className="relative flex w-full cursor-pointer items-center gap-2 rounded-md py-2 pl-2 pr-8 text-sm font-medium text-ink outline-none transition-colors data-[highlighted]:bg-raised data-[state=checked]:bg-brand-subtle data-[state=checked]:font-bold data-[state=checked]:text-brand"
                  >
                    {o.icon}
                    <Select.ItemText><span className="truncate">{o.label ?? o.name}</span></Select.ItemText>
                    <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                      <Select.ItemIndicator>
                        <Check size={14} />
                      </Select.ItemIndicator>
                    </span>
                  </Select.Item>
                )
              })}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}
