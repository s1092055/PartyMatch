import { getServiceById } from './serviceUtils'

// 方案的月費等值：年繳換算成月均（無年繳價則以月繳價乘 12 反推），月繳則直接回傳月費
export function getPlanMonthlyEquivalent(plan, billingCycle) {
  if (billingCycle === 'yearly' && plan.yearlyPrice) return plan.yearlyPrice / 12
  return plan.monthlyPrice
}

// 依 serviceId + planName 反查方案物件
export function getPlanByName(serviceId, planName) {
  return getServiceById(serviceId)?.plans?.find(p => p.name === planName) ?? null
}

// 方案分攤到每個席位的月費（依收費週期換算後再除以席位數，無條件進位）
export function calcPricePerSeat(plan, seats, billingCycle) {
  return Math.ceil(getPlanMonthlyEquivalent(plan, billingCycle) / seats)
}
