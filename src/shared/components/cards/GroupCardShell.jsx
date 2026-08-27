import { useRef, useState } from 'react'
import { Calendar, MoreHorizontal } from 'lucide-react'
import Badge from '../ui/Badge'
import ServiceLogo from '../ui/ServiceLogo'
import { daysUntil, formatRelativeDate } from '../../utils/date'
import { useClickOutside } from '../../utils/hooks'

function CardMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useClickOutside(open, [ref], () => setOpen(false))

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="grid h-7 w-7 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
        aria-label="更多選項"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 min-w-36 rounded-lg border border-line bg-white py-1 shadow-lg">
          {items.map((item) => (
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

const TERMINAL = new Set(['paused', 'cancelled', 'ended'])

const BILLING_TEXT = {
  pending_activation:   '等待啟用',
  pending_confirmation: '收款確認中',
  paused:               '服務已停止',
  cancelled:            '服務已取消',
  ended:                '服務已結束',
}

export function BillingDateRow({ status, nextBillingDate }) {
  if (status === 'active' && nextBillingDate) {
    const days = daysUntil(nextBillingDate)
    const isUpcoming = days >= 0 && days <= 7
    return (
      <div className={`flex items-center gap-1.5 text-sm ${isUpcoming ? 'text-warning-text' : 'text-ink-2'}`}>
        <Calendar size={14} className="shrink-0" />
        <span>下次扣款 {nextBillingDate}</span>
        {isUpcoming && <span className="text-xs">（{formatRelativeDate(nextBillingDate)}）</span>}
      </div>
    )
  }

  if (TERMINAL.has(status) && nextBillingDate) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-ink-3">
        <Calendar size={14} className="shrink-0" />
        <span>停止日期 {nextBillingDate}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-ink-3">
      <Calendar size={14} className="shrink-0" />
      <span>{BILLING_TEXT[status] ?? '啟用後開始計費'}</span>
    </div>
  )
}

export default function GroupCardShell({ serviceId, serviceName, planName, badgeVariant, infoRow, body, actions, menuItems }) {
  return (
    <div className="card flex flex-col gap-4 overflow-hidden p-5">
      {/* Header */}
      <div className="flex min-w-0 items-start gap-3">
        <ServiceLogo serviceId={serviceId} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-extrabold text-ink">{serviceName}</span>
            <Badge variant={badgeVariant} />
          </div>
          <p className="mt-0.5 text-sm text-ink-3">{planName}</p>
        </div>
        {menuItems?.length > 0 && <CardMenu items={menuItems} />}
      </div>

      {/* Info row */}
      {infoRow && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-y border-line-subtle py-3">
          {infoRow}
        </div>
      )}

      {/* Body — rendered as-is so each card controls its own layout */}
      {body}

      {/* Action row */}
      {actions && (
        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-line-subtle pt-4">
          {actions}
        </div>
      )}
    </div>
  )
}
