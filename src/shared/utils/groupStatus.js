// 成員自己已確認服務時，即使群組仍在等待其他成員確認（confirming），對這位成員來說也視為已啟用
export function isEffectivelyActive(status, confirmedAt) {
  return status === 'active' || (status === 'confirming' && !!confirmedAt)
}

// 「處理中」大分類涵蓋的細分狀態，團主／成員兩邊的篩選 tabs 共用同一份
export const PROCESSING_STATUSES = new Set(['full', 'pending_confirmation', 'pending_activation', 'confirming', 'disputed'])

// 帳號問題只能在啟用服務之前回報：成員一旦確認服務，代表帳號沒問題，事後才反悔已不合理
export function canReportServiceIssue(status) {
  return status === 'pending_confirmation' || status === 'pending_activation'
}
