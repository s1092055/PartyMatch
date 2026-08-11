// PM幣金額顯示元件
// 用法：<TokenAmount amount={500} cycle="monthly" /> → PM 500 /月
//       <TokenAmount amount={6000} cycle="yearly" />  → PM 6000 /年
//       <TokenAmount amount={500} />                  → PM 500

import pmCoinUrl from '../../assets/PMCoin.svg'

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
  // 中文單位字（/月／/年／/位）跟數字用同一套 items-baseline 對齊時，CJK 字元的字型
  // 基線比阿拉伯數字高，會看起來像浮起來、跟數字對不齊；改用 items-end 讓兩者底部切齊
  baseline: { wrapper: 'items-end', badge: 'self-center', amount: '',            unit: 'text-ink-3' },
  center:   { wrapper: 'items-center',   badge: '',             amount: 'leading-none', unit: 'text-[0.6em] font-semibold text-ink-3 leading-none' },
  // icon／金額／單位三者都靠下（底部）對齊在同一列。unit 刻意跟 amount 用完全一樣的字級——
  // 縮小 unit 字級（不管是直接改 font-size 還是用 scale 從 origin-bottom 縮）都會讓 CJK
  // 字元（位／月／年）本身的字型度量跟阿拉伯數字對不齊：就算用 getBoundingClientRect() 量
  // 出兩個文字方塊底部座標完全相同，視覺上「/位」的墨色（實際看得到的筆畫）還是會比數字
  // 低一點，這是字型渲染本身的問題，不是版面對不準。字級完全相同才不會有這個落差
  uniform:  { wrapper: 'items-end',      badge: '',             amount: 'leading-none', unit: 'text-ink-3 leading-none' },
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
