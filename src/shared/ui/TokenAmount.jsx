// PM 代幣金額顯示元件
// 用法：<TokenAmount amount={500} cycle="monthly" /> → PM 500 /月
//       <TokenAmount amount={6000} cycle="yearly" />  → PM 6000 /年
//       <TokenAmount amount={500} />                  → PM 500

export function TokenBadge({ className = '' }) {
  return (
    <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[9px] font-black leading-none text-white ${className}`}>
      PM
    </span>
  )
}

const ALIGN_VARIANTS = {
  baseline: { wrapper: 'items-baseline', badge: 'self-center', amount: '',            unit: 'text-ink-3' },
  center:   { wrapper: 'items-center',   badge: '',             amount: 'leading-none', unit: 'text-[0.6em] font-semibold text-ink-3 leading-none' },
}

export default function TokenAmount({ amount, cycle, className = '', badgeSize = '', unitClassName = '', align = 'baseline' }) {
  const unit = cycle === 'yearly' ? '/年' : cycle === 'monthly' ? '/月' : ''
  const variant = ALIGN_VARIANTS[align] ?? ALIGN_VARIANTS.baseline
  return (
    <span className={`inline-flex ${variant.wrapper} gap-1 ${className}`}>
      <TokenBadge className={`${variant.badge} ${badgeSize}`} />
      <span className={variant.amount}>{amount}</span>
      {unit && <span className={`${variant.unit} ${unitClassName}`}>{unit}</span>}
    </span>
  )
}
