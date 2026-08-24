import { isEffectivelyActive, PROCESSING_STATUSES } from '../../../common/utils/groupStatus'

export const FILTER_TABS = [
  { key: 'recruiting', label: '招募中' },
  { key: 'processing', label: '處理中' },
  { key: 'active',     label: '服務中' },
];

export function subscriptionBucket(sub) {
  const status = sub.groupStatus ?? sub.status
  if (isEffectivelyActive(status, sub.confirmedAt)) return 'active'
  return PROCESSING_STATUSES.has(status) ? 'processing' : status
}
