import { daysUntil } from './date'

// active 狀態且下次扣款日在 7 天內時，顯示為「即將續訂」，供團主卡片／成員訂閱卡片共用
export function getRenewalAwareStatus(status, nextBillingDate) {
  if (status === 'active' && nextBillingDate) {
    const days = daysUntil(nextBillingDate)
    if (days !== null && days <= 7) return 'active_renewal'
  }
  return status
}

// 已結束／已取消的群組，只在「群組紀錄」modal 顯示，不出現在一般篩選分類中；
// 團主（依 group.status）與成員（依 subscription 的 groupStatus）共用同一套判斷
export const HISTORY_STATUSES = new Set(['cancelled', 'ended'])

export function isHistoryGroup(group) {
  return HISTORY_STATUSES.has(group.status)
}

export function isHistorySubscription(sub) {
  return HISTORY_STATUSES.has(sub.groupStatus ?? sub.status)
}

// 「進行中／服務中／已結束」三分類，跟 isHistoryGroup 共用同一組 HISTORY_STATUSES，
// 供任何需要粗略分群組狀態的篩選器使用（例如訊息中心左側列表的「群組狀態」篩選）
export function getGroupStatusBucket(status) {
  if (isHistoryGroup({ status })) return 'history'
  return status === 'active' ? 'active' : 'processing'
}
