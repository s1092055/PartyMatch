import { daysUntil } from '../../../../shared/utils/date'

export function getGroupDisplayStatus(group) {
  if (group.status === 'active' && group.nextBillingDate) {
    const days = daysUntil(group.nextBillingDate)
    if (days !== null && days <= 7) return 'active_renewal'
  }
  return group.status
}

export const GROUP_ACTION_MAP = {
  recruiting:           { menu: [] },
  full:                 { menu: [] },
  pending_confirmation: { menu: [] },
  pending_activation:   { menu: [] },
  active:               { menu: [] },
  active_renewal: {
    menu: [
      { key: 'prepareRenewal', label: '準備續訂' },
    ],
  },
  paused: {
    menu: [
      { key: 'viewHistory', label: '查看紀錄' },
    ],
  },
  cancelled: {
    menu: [
      { key: 'viewHistory', label: '查看紀錄' },
    ],
  },
  ended: {
    menu: [
      { key: 'viewHistory', label: '查看紀錄' },
    ],
  },
}
