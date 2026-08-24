export function resolvePlanDisplayPrice(plan, usdToTwdRate) {
  if (plan.billingCycle !== 'yearly') {
    return { amount: plan.monthlyPrice, cycle: 'monthly' }
  }
  if (plan.yearlyPrice) return { amount: plan.yearlyPrice, cycle: 'yearly' }
  if (plan.yearlyPriceUsd) return { amount: Math.round(plan.yearlyPriceUsd * usdToTwdRate), cycle: 'yearly' }
  return { amount: plan.monthlyPrice * 12, cycle: 'yearly' }
}
