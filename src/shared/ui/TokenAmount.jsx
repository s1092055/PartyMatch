// PM 代幣金額顯示元件
// 用法：<TokenAmount amount={500} cycle="monthly" /> → PM 500 /月
//       <TokenAmount amount={6000} cycle="yearly" />  → PM 6000 /年
//       <TokenAmount amount={500} />                  → PM 500

export function TokenBadge({ className = '' }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-black leading-none text-white ${className}`}>
      PM
    </span>
  )
}

export default function TokenAmount({ amount, cycle, className = '', badgeSize = '', unitClassName = '' }) {
  const unit = cycle === 'yearly' ? '/年' : cycle === 'monthly' ? '/月' : ''
  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`}>
      <TokenBadge className={badgeSize} />
      <span>{amount}</span>
      {unit && <span className={`text-xs font-normal text-ink-3 ${unitClassName}`}>{unit}</span>}
    </span>
  )
}
