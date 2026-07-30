import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { cn } from "../../../lib/utils"

export default function CustomSelect({ label, value, onChange, options, className }) {
  const selectedOption = options.find(o => (o.value ?? o.id) === value)

  return (
    <div className={cn('relative min-w-0 flex-1', className)}>
      {label && (
        <span className="mb-1 block text-2xs font-medium text-ink-3 text-center md:text-left">{label}</span>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 w-full font-bold">
          {selectedOption?.icon}
          <SelectValue>
            <span className="truncate">{selectedOption?.label ?? selectedOption?.name}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map(o => {
            const val = o.value ?? o.id
            return (
              <SelectItem key={val} value={val}>
                {o.icon}
                <span className="truncate">{o.label ?? o.name}</span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
