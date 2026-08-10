export const DEFAULT_CREDIT_SCORE = 100

export const CREDIT_RULES = {
  PAYMENT_CONFIRMED: +2,   // 付款被團主確認
  MEMBER_REMOVED:   -10,   // 被移除出群組
  GROUP_ACTIVATED:  +5,    // 團主成功啟用群組
}

export function formatMinCreditScore(score) {
  return score ? `${score} 分以上` : '不限'
}

export function getCreditDisplay(score) {
  if (score >= 90) return { label: '優良', color: 'text-success-text', bg: 'bg-success-subtle', border: 'border-success/30' }
  if (score >= 70) return { label: '良好', color: 'text-info-text',    bg: 'bg-info-subtle',    border: 'border-info/30' }
  if (score >= 50) return { label: '普通', color: 'text-warning-text', bg: 'bg-warning-subtle', border: 'border-warning/30' }
  return                   { label: '待改善', color: 'text-danger-text', bg: 'bg-danger-subtle', border: 'border-danger/30' }
}
