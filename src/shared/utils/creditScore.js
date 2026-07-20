export const DEFAULT_CREDIT_SCORE = 80

export const CREDIT_RULES = {
  PAYMENT_CONFIRMED: +2,   // 付款被團主確認
  MEMBER_REMOVED:   -10,   // 被移除出群組
  GROUP_ACTIVATED:  +5,    // 團主成功啟用群組
}

export function formatMinCreditScore(score) {
  return score ? `${score} 分以上` : '不限'
}

export function getCreditDisplay(score) {
  if (score >= 90) return { label: '優良', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
  if (score >= 70) return { label: '良好', color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200' }
  if (score >= 50) return { label: '普通', color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' }
  return                   { label: '待改善', color: 'text-red-600',  bg: 'bg-red-50',     border: 'border-red-200' }
}
