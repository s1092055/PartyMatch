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
        <Select.Trigger className="field group flex h-11 w-full items-center justify-between gap-2 px-3 text-sm font-bold text-ink transition-colors focus:border-line focus:shadow-none data-[state=open]:shadow-none [&>span]:min-w-0">
          <Select.Value className="flex flex-1 items-center gap-2 truncate text-left">
            {selectedOption?.icon}
            <span className="truncate">{selectedOption?.label ?? selectedOption?.name}</span>
          </Select.Value>
          <Select.Icon className="shrink-0">
            <ChevronDown size={15} strokeWidth={1.5} className="text-ink-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={6}
            className="z-50 w-[var(--radix-select-trigger-width)] max-w-[min(20rem,90vw)] overflow-hidden rounded-control border border-line bg-surface shadow-lg"
          >
            <Select.Viewport className="max-h-60 overflow-y-auto scrollbar-none py-1">
              {options.map(o => {
                const val = o.value ?? o.id
                return (
                  <Select.Item
                    key={val}
                    value={val}
                    className="flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm font-medium text-ink outline-none transition-colors data-[highlighted]:bg-raised data-[state=checked]:bg-brand-subtle data-[state=checked]:font-bold data-[state=checked]:text-brand"
                  >
                    <span className="flex flex-1 items-center gap-2 text-left">
                      {o.icon}
                      <Select.ItemText><span className="truncate">{o.label ?? o.name}</span></Select.ItemText>
                    </span>
                    <Select.ItemIndicator>
                      <Check size={14} className="shrink-0" />
                    </Select.ItemIndicator>
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
