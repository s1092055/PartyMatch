import { BADGE_LABELS } from './badgeLabels'

const VARIANTS = {
  recruiting:           'bg-success-subtle text-success-text',
  pending_activation:   'bg-warning-subtle text-warning-text',
  active:               'bg-success-subtle text-success-text',
  paused:               'bg-slate-100 text-slate-500',
  cancelled:            'bg-danger-subtle text-danger-text',
  full:                 'bg-raised text-ink-2',
  pending_confirmation: 'bg-warning-subtle text-warning-text',
  active_renewal:       'bg-success-subtle text-success-text',
  confirming:           'bg-info-subtle text-info-text',
  disputed:             'bg-danger-subtle text-danger-text',
  ended:                'bg-slate-100 text-slate-400',
  closed:               'bg-danger-subtle text-danger-text',
  approval:             'bg-info-subtle text-info-text',
  pending:              'bg-warning-subtle text-warning-text',
  verified:             'bg-info-subtle text-info-text',
  upcoming:             'bg-brand-subtle text-brand',
  member_joined:        'bg-success-subtle text-success-text',
  default:              'bg-raised text-ink-2',
}

export default function Badge({ variant = 'default', label, className = '' }) {
  const cls  = VARIANTS[variant] ?? VARIANTS.default
  const text = label ?? BADGE_LABELS[variant] ?? variant

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-badge text-2xs font-semibold whitespace-nowrap ${cls} ${className}`}
    >
      {text}
    </span>
  )
}
