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
    // 鎖定當下算出來的日期只是預估，真正定案要等啟用服務那一步重新計算（同一套規則見
    // HostedGroupCard 卡片上的「預估下次扣款」標籤），nextBillingDate 未設定（招募中／
    // 已解散／已結束）時整列不顯示
    ...(group.nextBillingDate ? [{
      label: '下次扣款',
      value: `${group.nextBillingDate.slice(0, 10).replace(/-/g, '/')}${['pending_confirmation', 'pending_activation'].includes(group.status) ? '（預估）' : ''}`,
    }] : []),
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
