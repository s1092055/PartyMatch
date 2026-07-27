import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useClickOutside } from '../../utils/hooks'

export default function CustomSelect({ label, value, onChange, options, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selectedOption = options.find(o => (o.value ?? o.id) === value)
  const selectedLabel = selectedOption?.label ?? ''
  const selectedIcon = selectedOption?.icon ?? null

  useClickOutside(open, [ref], () => setOpen(false))

  useEffect(() => {
    if (!open) return
    function handleEsc(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open])

  return (
    <div ref={ref} className={`relative min-w-0 flex-1 ${className}`}>
      {label && (
        <span className="mb-1 block text-2xs font-medium text-ink-3 text-center md:text-left">{label}</span>
      )}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`field relative z-10 flex h-11 w-full items-center justify-between gap-2 px-3 text-sm font-bold text-ink transition-colors focus:border-line focus:shadow-none active:scale-100 ${
          open ? 'rounded-b-none' : ''
        }`}
      >
        <span className="flex flex-1 items-center gap-2 truncate text-left">
          {selectedIcon}
          <span className="truncate">{selectedLabel}</span>
        </span>
        <ChevronDown
          size={15}
          strokeWidth={1.5}
          className={`shrink-0 text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 w-max min-w-full max-w-[min(20rem,90vw)] overflow-y-auto scrollbar-none rounded-b-control border border-t-0 border-line bg-surface py-1 shadow-lg max-h-60"
        >
          {options.map(o => {
            const val = o.value ?? o.id
            const isSelected = val === value
            return (
              <li
                key={val}
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(val); setOpen(false) }}
                className={`flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                  isSelected
                    ? 'bg-brand-subtle font-bold text-brand'
                    : 'font-medium text-ink hover:bg-raised'
                }`}
              >
                <span className="flex flex-1 items-center gap-2 text-left">
                  {o.icon}
                  <span className="truncate">{o.label ?? o.name}</span>
                </span>
                {isSelected && <Check size={14} className="shrink-0" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
