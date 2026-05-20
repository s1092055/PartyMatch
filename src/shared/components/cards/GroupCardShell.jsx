import { useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import Badge from '../ui/Badge'
import ServiceLogo from '../ui/ServiceLogo'
import { useClickOutside } from '../../utils/hooks'

function CardMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useClickOutside(open, [ref], () => setOpen(false))

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="grid h-7 w-7 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
        aria-label="更多選項"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 min-w-36 rounded-lg border border-line bg-surface py-1 shadow-lg">
          {items.map(item => (
            <button
              key={item.label}
              onClick={() => { item.onClick?.(); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-raised"
            >
              {item.Icon && <item.Icon size={14} className="shrink-0 text-ink-3" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GroupCardShell({ serviceId, serviceName, planName, badgeVariant, chips, actions, menuItems }) {
  return (
    <div className="card relative flex flex-col overflow-hidden p-0">
      
      <div className="absolute left-3 top-3 z-10">
        <Badge variant={badgeVariant} />
      </div>

{menuItems?.length > 0 && (
        <div className="absolute right-3 top-3 z-10">
          <CardMenu items={menuItems} />
        </div>
      )}

<div className="flex flex-1">
        
        <div className="flex w-[45%] shrink-0 flex-col items-center justify-center gap-3 px-4 pb-5 pt-10">
          <ServiceLogo serviceId={serviceId} size={56} />
          <div className="w-full text-center">
            <p className="truncate font-bold text-ink">{serviceName}</p>
            <p className="truncate text-xs text-ink-3">{planName}</p>
          </div>
        </div>

<div className="flex flex-1 flex-col justify-center gap-2 p-4 pt-10">
          {chips?.map((chip, i) => (
            <span
              key={i}
              className={`flex items-center gap-1.5 text-xs ${chip.accent ? 'font-semibold text-warning-text' : 'text-ink-3'}`}
            >
              {chip.Icon && <chip.Icon size={12} className="shrink-0" />}
              {chip.label}
            </span>
          ))}
        </div>
      </div>

{actions && (
        <div className="flex justify-center border-t border-line-subtle py-3">
          {actions}
        </div>
      )}
    </div>
  )
}
