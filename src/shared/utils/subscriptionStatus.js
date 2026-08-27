import { daysUntil } from './date'

export function effectiveStatus(sub) {
  if (sub.paymentStatus === 'markedPaid') return 'markedPaid'
  if (sub.paymentStatus === 'confirmed') return 'confirmed'
  if (sub.groupStatus === 'pending_activation') return 'waiting_activation'
  if ((sub.paymentStatus ?? 'pending') !== 'paid' && daysUntil(sub.nextBillingDate) < 0) {
    return 'overdue'
  }
  return sub.paymentStatus ?? 'pending'
}
