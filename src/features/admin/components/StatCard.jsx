import { Card } from '../../../components/ui/card'

export default function StatCard({ icon: Icon, label, value, sub, tone = 'default' }) {
  const toneClass = {
    default: 'text-ink',
    danger:  'text-danger',
    warning: 'text-warning-text',
    success: 'text-success-text',
  }[tone]

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2 text-ink-3">
        <Icon size={15} strokeWidth={1.5} />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className={`text-2xl font-black ${toneClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-4">{sub}</p>}
    </Card>
  )
}
