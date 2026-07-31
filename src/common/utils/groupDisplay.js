// 群組詳情頁共用的純資料/標籤輔助函式（與 GroupOverviewContent.jsx 分開，
// 避免該檔案同時匯出元件與常數/函式導致 React Fast Refresh 失效）。
import { formatMinCreditScore } from './creditScore'
import { calcDisplayPrice, calcDisplayCycle } from './pricingUtils'

export function getInfoRows(group) {
  if (!group) return []
  const displayPrice = calcDisplayPrice(group.pricePerSeat, group.billingCycle)
  return [
    { label: '群組狀態', badge: group.status },
    { label: '建立時間', value: group.createdAt?.slice(0, 10).replace(/-/g, '/') ?? '—' },
    {
      label: '每位價格',
      priceInfo: Number.isFinite(displayPrice)
        ? { amount: displayPrice, cycle: calcDisplayCycle(group.billingCycle) }
        : null,
    },
    { label: '帳號需求', value: group.requirements || '無' },
    { label: '信用分數', value: formatMinCreditScore(group.minCreditScore) },
  ]
}
