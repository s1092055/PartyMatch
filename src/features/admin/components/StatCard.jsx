import { Card } from '../../../components/ui/card'

const TONE_CLASSES = {
  default: { value: 'text-ink',          iconBg: 'bg-raised text-ink-3' },
  danger:  { value: 'text-danger',       iconBg: 'bg-danger-subtle text-danger-text' },
  warning: { value: 'text-warning-text', iconBg: 'bg-warning-subtle text-warning-text' },
  success: { value: 'text-success-text', iconBg: 'bg-success-subtle text-success-text' },
}

export default function StatCard({ icon: Icon, label, value, sub, tone = 'default' }) {
  const { value: valueClass, iconBg } = TONE_CLASSES[tone]

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-3">{label}</span>
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${iconBg}`}>
          <Icon size={14} strokeWidth={1.5} />
        </span>
      </div>
      <p className={`text-2xl font-black ${valueClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-4">{sub}</p>}
    </Card>
  )
}
