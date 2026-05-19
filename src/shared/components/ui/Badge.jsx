const VARIANTS = {
  recruiting: {
    cls: 'bg-success-subtle text-success-text',
    dot: 'bg-success',
  },
  pending_activation: {
    cls: 'bg-warning-subtle text-warning-text',
    dot: 'bg-warning',
  },
  active: {
    cls: 'bg-brand-subtle text-brand',
    dot: 'bg-brand',
  },
  paused: {
    cls: 'bg-slate-100 text-slate-500',
    dot: null,
  },
  cancelled: {
    cls: 'bg-danger-subtle text-danger-text',
    dot: null,
  },
  full: {
    cls: 'bg-raised text-ink-2',
    dot: null,
  },
  pending_confirmation: {
    cls: 'bg-orange-50 text-orange-600',
    dot: 'bg-orange-400',
  },
  ended: {
    cls: 'bg-slate-100 text-slate-400',
    dot: null,
  },
  closed: {
    cls: 'bg-danger-subtle text-danger-text',
    dot: null,
  },
  approval: {
    cls: 'bg-info-subtle text-info-text',
    dot: null,
  },
  instant: {
    cls: 'bg-success-subtle text-success-text',
    dot: null,
  },
  pending: {
    cls: 'bg-warning-subtle text-warning-text',
    dot: 'bg-warning',
  },
  paid: {
    cls: 'bg-success-subtle text-success-text',
    dot: null,
  },
  overdue: {
    cls: 'bg-danger-subtle text-danger-text',
    dot: 'bg-danger',
  },
  verified: {
    cls: 'bg-info-subtle text-info-text',
    dot: null,
  },
  upcoming: {
    cls: 'bg-brand-subtle text-brand',
    dot: 'bg-brand',
  },
  markedPaid: {
    cls: 'bg-purple-subtle text-purple-text',
    dot: 'bg-purple',
  },
  confirmed: {
    cls: 'bg-success-subtle text-success-text',
    dot: 'bg-success',
  },
  waiting_activation: {
    cls: 'bg-purple-subtle text-purple-text',
    dot: 'bg-purple',
  },
  default: {
    cls: 'bg-raised text-ink-2',
    dot: null,
  },
}

const LABELS = {
  recruiting:         '招募中',
  pending_activation: '待啟用',
  active:             '已啟用',
  paused:             '已停止',
  cancelled:          '已取消',
  full:               '已滿員',
  pending_confirmation: '待確認',
  ended:              '已結束',
  closed:             '已關閉',
  approval:           '審核加入',
  instant:            '立即加入',
  pending:            '待付款',
  paid:               '已付款',
  overdue:            '逾期',
  verified:           '已驗證',
  upcoming:           '即將續訂',
  markedPaid:         '已標記付款',
  confirmed:          '付款已確認',
  waiting_activation: '等待團主啟用',
}

export default function Badge({ variant = 'default', label, className = '' }) {
  const cfg = VARIANTS[variant] ?? VARIANTS.default
  const text = label ?? LABELS[variant] ?? variant

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-badge text-2xs font-semibold whitespace-nowrap ${cfg.cls} ${className}`}
    >
      {cfg.dot && <span className={`status-dot ${cfg.dot}`} />}
      {text}
    </span>
  )
}
