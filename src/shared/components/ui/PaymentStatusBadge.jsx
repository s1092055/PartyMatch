import { CheckCircle2, Clock, Hourglass } from 'lucide-react'

const CONFIG = {
  paid:       { label: '已確認收款', cls: 'bg-success-subtle text-success-text', Icon: CheckCircle2 },
  confirmed:  { label: '已確認收款', cls: 'bg-success-subtle text-success-text', Icon: CheckCircle2 },
  markedPaid: { label: '已標記付款', cls: 'bg-purple-subtle  text-purple-text',  Icon: Hourglass   },
  pending:    { label: '待付款',     cls: 'bg-warning-subtle text-warning-text', Icon: Clock       },
}

export default function PaymentStatusBadge({ status, className = '' }) {
  const cfg = CONFIG[status] ?? CONFIG.pending
  return (
    <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls} ${className}`}>
      <cfg.Icon size={11} />
      {cfg.label}
    </span>
  )
}
