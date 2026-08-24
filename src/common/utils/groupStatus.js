export function isEffectivelyActive(status, confirmedAt) {
  return status === 'active' || (status === 'confirming' && !!confirmedAt)
}

export const PROCESSING_STATUSES = new Set(['full', 'pending_confirmation', 'pending_activation', 'confirming', 'disputed']);

export function canReportServiceIssue(status) {
  return status === 'pending_confirmation' || status === 'pending_activation'
}
