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
    cls: 'bg-success-subtle text-success-text',
    dot: 'bg-success',
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
    cls: 'bg-warning-subtle text-warning-text',
    dot: 'bg-warning',
  },
  active_renewal: {
    cls: 'bg-success-subtle text-success-text',
    dot: 'bg-success',
  },
  confirming: {
    cls: 'bg-info-subtle text-info-text',
    dot: 'bg-info',
  },
  disputed: {
    cls: 'bg-danger-subtle text-danger-text',
    dot: 'bg-danger',
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
  pending: {
    cls: 'bg-warning-subtle text-warning-text',
    dot: 'bg-warning',
  },
  verified: {
    cls: 'bg-info-subtle text-info-text',
    dot: null,
  },
  upcoming: {
    cls: 'bg-brand-subtle text-brand',
    dot: 'bg-brand',
  },
  member_joined: {
    cls: 'bg-success-subtle text-success-text',
    dot: 'bg-success',
  },
  default: {
    cls: 'bg-raised text-ink-2',
    dot: null,
  },
}

const LABELS = {
  recruiting:         '招募中',
  pending_activation: '待啟用',
  active:             '啟用中',
  cancelled:          '已取消',
  full:               '已滿員',
  pending_confirmation: '待填帳號',
  confirming:           '確認期中',
  disputed:             '申訴中',
  ended:              '已結束',
  paused:             '已暫停',
  closed:             '已關閉',
  approval:           '審核加入',
  pending:            '待確認',
  verified:           '已驗證',
  upcoming:           '即將續訂',
  member_joined:      '申請通過',
  active_renewal:     '即將續訂',
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
