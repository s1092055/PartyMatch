import TokenAmount from './TokenAmount'

const TONE_CLASSES = {
  info:    { border: 'border-info/30', bg: 'bg-info-subtle', icon: 'text-info', text: 'text-info-text' },
  success: { border: 'border-success/30', bg: 'bg-success-subtle', icon: 'text-success', text: 'text-success-text' },
}

export default function EscrowStatusCard({ tone, icon: Icon, title, subtitle, amount }) {
  const cls = TONE_CLASSES[tone] ?? TONE_CLASSES.info
  return (
    <div className={`flex items-center gap-3 rounded-lg border ${cls.border} ${cls.bg} px-4 py-3`}>
      <Icon size={16} strokeWidth={1.5} className={`shrink-0 ${cls.icon}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${cls.text}`}>{title}</p>
        {subtitle && <p className={`text-xs ${cls.text}/70`}>{subtitle}</p>}
      </div>
      <span className={`shrink-0 text-sm font-bold ${cls.text}`}><TokenAmount amount={amount} /></span>
    </div>
  )
}
