// 席位費用（yearly = monthlyFee * 12），套用/續訂/移除成員時的退補款計算共用同一份邏輯
export function computeSeatCost(group) {
  // monthlyFee 是 Prisma Decimal 型別，讀出來是 Decimal.js 物件不是普通 number，
  // 算術運算前要先明確轉成 Number（金額範圍小，轉換不會有精度損失疑慮）
  const monthlyFee = Number(group.monthlyFee)
  return group.billingCycle === 'yearly'
    ? Math.round(monthlyFee * 12)
    : Math.round(monthlyFee)
}

// Prisma Decimal 欄位序列化成 JSON 回應會變成字串，回傳給前端前統一轉回 number，
// 前端才能維持原本直接把 monthlyFee 當數字做運算/顯示的寫法，不用另外改
export function toPlainGroup(group) {
  if (!group || group.monthlyFee == null) return group
  return { ...group, monthlyFee: Number(group.monthlyFee) }
}
