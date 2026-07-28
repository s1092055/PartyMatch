// 方案分攤到每個席位的月費（monthlyPrice 已是該方案週期換算後的月費，無條件進位）
export function calcPricePerSeat(plan, seats) {
  return Math.ceil(plan.monthlyPrice / seats)
}

// 年繳方案顯示的是整年總額，月繳方案顯示單月金額
export function calcDisplayPrice(pricePerSeat, billingCycle) {
  return billingCycle === 'yearly' ? pricePerSeat * 12 : pricePerSeat
}

// 正規化週期供 <TokenAmount cycle> 使用（非 yearly 一律視為 monthly）
export function calcDisplayCycle(billingCycle) {
  return billingCycle === 'yearly' ? 'yearly' : 'monthly'
}

// 「方案總價」預覽用的實際金額：優先採用官方台幣年繳總價（yearlyPrice），
// 其次是官方美金年繳定價（yearlyPriceUsd，用即時匯率換算），都沒有的話才退回
// monthlyPrice×12 概算
export function resolvePlanDisplayPrice(plan, usdToTwdRate) {
  if (plan.billingCycle !== 'yearly') {
    return { amount: plan.monthlyPrice, cycle: 'monthly' }
  }
  if (plan.yearlyPrice) return { amount: plan.yearlyPrice, cycle: 'yearly' }
  if (plan.yearlyPriceUsd) return { amount: Math.round(plan.yearlyPriceUsd * usdToTwdRate), cycle: 'yearly' }
  return { amount: plan.monthlyPrice * 12, cycle: 'yearly' }
}
