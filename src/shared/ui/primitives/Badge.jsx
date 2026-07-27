import { BADGE_LABELS, BADGE_VARIANTS } from './badgeLabels'

export default function Badge({ variant = 'default', label, className = '' }) {
  const cls  = BADGE_VARIANTS[variant] ?? BADGE_VARIANTS.default
  const text = label ?? BADGE_LABELS[variant] ?? variant

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-badge text-2xs font-semibold whitespace-nowrap ${cls} ${className}`}
    >
      {text}
    </span>
  )
}
