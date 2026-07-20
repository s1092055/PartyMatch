// 席位費用（yearly = monthlyFee * 12），套用/續訂/移除成員時的退補款計算共用同一份邏輯
export function computeSeatCost(group) {
  return group.billingCycle === 'yearly'
    ? Math.round(group.monthlyFee * 12)
    : Math.round(group.monthlyFee)
}
