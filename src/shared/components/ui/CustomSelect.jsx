import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export default function CustomSelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selectedLabel = options.find(o => (o.value ?? o.id) === value)?.label ?? ''

  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function handleEsc(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      {label && (
        <span className="mb-1 block text-2xs font-medium text-ink-3 text-center md:text-left">{label}</span>
      )}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`field flex h-11 w-full items-center justify-between gap-2 px-3 text-sm font-bold text-ink transition-colors hover:border-line-strong ${
          open ? 'border-brand shadow-[0_0_0_3px_rgb(8_102_242_/_0.14)]' : ''
        }`}
      >
        <span className="flex-1 truncate text-left">{selectedLabel}</span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 z-50 mt-1.5 w-full overflow-y-auto rounded-xl border border-line bg-surface py-1 shadow-lg max-h-60"
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
                <span className="flex-1 text-left">{o.label ?? o.name}</span>
                {isSelected && <Check size={14} className="shrink-0" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
