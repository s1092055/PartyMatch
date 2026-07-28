// 「方案總價」預覽用的實際金額：優先採用官方台幣年繳總價（yearlyPrice），
// 其次是官方美金年繳定價（yearlyPriceUsd，用即時匯率換算），都沒有的話才退回
// monthlyPrice×12 概算。獨立成一個檔案（而不是放在單純數學運算的 pricingUtils.js），
// 因為這裡牽涉到 serviceCatalog 資料來源判斷與即時匯率換算，屬於不同層級的邏輯
export function resolvePlanDisplayPrice(plan, usdToTwdRate) {
  if (plan.billingCycle !== 'yearly') {
    return { amount: plan.monthlyPrice, cycle: 'monthly' }
  }
  if (plan.yearlyPrice) return { amount: plan.yearlyPrice, cycle: 'yearly' }
  if (plan.yearlyPriceUsd) return { amount: Math.round(plan.yearlyPriceUsd * usdToTwdRate), cycle: 'yearly' }
  return { amount: plan.monthlyPrice * 12, cycle: 'yearly' }
}
