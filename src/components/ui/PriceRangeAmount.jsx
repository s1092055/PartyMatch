import { TokenBadge } from './TokenAmount'

// 「每人申請費用」等區間篩選條件的金額顯示：有設定時是 PM幣圖示 + 區間文字（如「500 以下」），
// label 為 null（不限）時顯示純文字「不限」，用 unlimitedClassName 客製化不限狀態的文字樣式
export default function PriceRangeAmount({ label, className = '', badgeClassName = '', unlimitedClassName = '' }) {
  if (label == null) return <span className={unlimitedClassName}>不限</span>
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <TokenBadge className={`shrink-0 ${badgeClassName}`} />
      {label}
    </span>
  )
}
