import { Calendar } from 'lucide-react'
import { daysUntil } from './date'

export const BILLING_TEXT = {
  pending_activation:   '等待啟用',
  pending_confirmation: '收款確認中',
  paused:               '服務已停止',
  cancelled:            '服務已取消',
  ended:                '服務已結束',
}

export function billingChip(status, nextBillingDate) {
  if (status === 'active' && nextBillingDate) {
    const days = daysUntil(nextBillingDate)
    const isUpcoming = days !== null && days >= 0 && days <= 7
    return { Icon: Calendar, label: `扣款 ${nextBillingDate}`, accent: isUpcoming }
  }
  return { Icon: Calendar, label: BILLING_TEXT[status] ?? '啟用後計費' }
}
