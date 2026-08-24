import { PROCESSING_STATUSES } from '../../../common/utils/groupStatus'

export const STATUS_FILTER_TABS = [
  { key: 'recruiting', label: '招募中' },
  { key: 'processing', label: '處理中' },
  { key: 'active',     label: '服務中' },
];

export function matchesFilter(group, filterKey) {
  if (filterKey === 'processing') return PROCESSING_STATUSES.has(group.status)
  return group.status === filterKey
}

export function calcApprovalSeatPatch(seats, alreadyMember) {
  if (alreadyMember) return null
  const newUsedSeats = seats.usedSeats + 1
  const newOpenSeats = seats.openSeats - 1
  return { usedSeats: newUsedSeats, openSeats: newOpenSeats, ...(newOpenSeats === 0 ? { status: 'full' } : {}) }
}
