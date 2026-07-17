export const STATUS_FILTER_TABS = [
  { key: 'all',        label: '全部'   },
  { key: 'recruiting', label: '招募中' },
  { key: 'pending',    label: '處理中' },
  { key: 'active',     label: '啟用中' },
  { key: 'cancelled',  label: '已結束' },
]

const PENDING_STATUSES   = new Set(['full', 'pending_confirmation', 'pending_activation'])
const CANCELLED_STATUSES = new Set(['cancelled', 'ended'])

export function matchesFilter(group, filterKey) {
  if (filterKey === 'all')        return true
  if (filterKey === 'recruiting') return group.status === 'recruiting'
  if (filterKey === 'pending')    return PENDING_STATUSES.has(group.status)
  if (filterKey === 'active')     return ['active', 'confirming', 'disputed', 'paused'].includes(group.status)
  if (filterKey === 'cancelled')  return CANCELLED_STATUSES.has(group.status)
  return true
}

export function calcApprovalSeatPatch(seats, alreadyMember) {
  if (alreadyMember) return null
  const newUsedSeats = seats.usedSeats + 1
  const newOpenSeats = seats.openSeats - 1
  return { usedSeats: newUsedSeats, openSeats: newOpenSeats, ...(newOpenSeats === 0 ? { status: 'full' } : {}) }
}
