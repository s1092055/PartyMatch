import { getServiceById } from './serviceUtils'

// 依 serviceId + planName 反查方案物件（每個方案本身即含唯一週期，name 已包含週期資訊）
export function getPlanByName(serviceId, planName) {
  return getServiceById(serviceId)?.plans?.find(p => p.name === planName) ?? null
}

// 方案分攤到每個席位的月費（monthlyPrice 已是該方案週期換算後的月費，無條件進位）
export function calcPricePerSeat(plan, seats) {
  return Math.ceil(plan.monthlyPrice / seats)
}

// 年繳方案顯示的是整年總額，月繳方案顯示單月金額
export function calcDisplayPrice(pricePerSeat, billingCycle) {
  return billingCycle === 'yearly' ? pricePerSeat * 12 : pricePerSeat
}
