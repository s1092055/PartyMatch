export function effectiveStatus(sub) {
  if (sub.groupStatus === 'active') return 'active'
  return sub.status ?? 'pending'
}
