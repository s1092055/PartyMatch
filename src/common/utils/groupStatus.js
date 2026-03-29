export function isEffectivelyActive(status, confirmedAt) {
  return status === 'active' || (status === 'confirming' && !!confirmedAt)
}

export function canReportServiceIssue(status) {
  return status === 'pending_confirmation' || status === 'pending_activation'
}
