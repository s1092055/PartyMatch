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
