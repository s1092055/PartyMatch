import pmCoinUrl from '../../assets/PMCoin.svg';

export function TokenBadge({ className = '' }) {
  return (
    <img
      src={pmCoinUrl}
      alt="PM幣"
      className={`inline-block h-5 w-5 shrink-0 ${className}`}
    />
  )
}

const ALIGN_VARIANTS = {
  baseline: { wrapper: 'items-end', badge: 'self-center', amount: '',            unit: 'text-ink-3' },
  center:   { wrapper: 'items-center',   badge: '',             amount: 'leading-none', unit: 'text-[0.6em] font-semibold text-ink-3 leading-none' },
  uniform: { wrapper: 'items-end',      badge: '',             amount: 'leading-none', unit: 'text-ink-3 leading-none' },
}

export default function TokenAmount({ amount, cycle, unit: unitOverride, className = '', badgeSize = '', unitClassName = '', align = 'baseline' }) {
  const unit = unitOverride ?? (cycle === 'yearly' ? '/年' : cycle === 'monthly' ? '/月' : '')
  const variant = ALIGN_VARIANTS[align] ?? ALIGN_VARIANTS.baseline
  return (
    <span className={`inline-flex ${variant.wrapper} gap-1 ${className}`}>
      <TokenBadge className={`${variant.badge} ${badgeSize}`} />
      <span className={variant.amount}>{amount}</span>
      {unit && <span className={`${variant.unit} ${unitClassName}`}>{unit}</span>}
    </span>
  )
}
