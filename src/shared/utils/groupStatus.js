// 成員自己已確認服務時，即使群組仍在等待其他成員確認（confirming），對這位成員來說也視為已啟用
export function isEffectivelyActive(status, confirmedAt) {
  return status === 'active' || (status === 'confirming' && !!confirmedAt)
}
