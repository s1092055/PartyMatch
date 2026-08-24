import { daysUntil } from './date'

export function getRenewalAwareStatus(status, nextBillingDate) {
  if (status === 'active' && nextBillingDate) {
    const days = daysUntil(nextBillingDate)
    if (days !== null && days <= 7) return 'active_renewal'
  }
  return status
}

export const HISTORY_STATUSES = new Set(['cancelled', 'ended']);

export function isHistoryGroup(group) {
  return HISTORY_STATUSES.has(group.status)
}

export function isHistorySubscription(sub) {
  return HISTORY_STATUSES.has(sub.groupStatus ?? sub.status)
}

export function getGroupStatusBucket(status) {
  if (isHistoryGroup({ status })) return 'history'
  return status === 'active' ? 'active' : 'processing'
}
