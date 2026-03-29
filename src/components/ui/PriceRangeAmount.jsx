import { TokenBadge } from './TokenAmount'

export default function PriceRangeAmount({ label, className = '', badgeClassName = '', unlimitedClassName = '' }) {
  if (label == null) return <span className={unlimitedClassName}>不限</span>
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <TokenBadge className={`shrink-0 ${badgeClassName}`} />
      {label}
    </span>
  )
}
