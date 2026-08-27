import { daysUntil } from '../../../shared/utils/date'

export function getGroupDisplayStatus(group) {
  if (group.status === 'active' && group.nextBillingDate) {
    const days = daysUntil(group.nextBillingDate)
    if (days !== null && days <= 7) return 'active_renewal'
  }
  return group.status
}

export const GROUP_ACTION_MAP = {
  recruiting: {
    primary: [
      { key: 'viewPayments',     label: '收款狀態', variant: 'secondary' },
      { key: 'manageMembers',    label: '管理成員', variant: 'secondary' },
    ],
    menu: [
      { key: 'editGroup',        label: '編輯群組' },
    ],
  },
  full: {
    primary: [
      { key: 'viewPayments',     label: '收款狀態', variant: 'secondary' },
      { key: 'manageMembers',    label: '管理成員', variant: 'secondary' },
    ],
    menu: [
      { key: 'editGroup',        label: '編輯群組' },
    ],
  },
  pending_confirmation: {
    primary: [
      { key: 'viewPayments',     label: '確認收款', variant: 'primary'   },
      { key: 'manageMembers',    label: '管理成員', variant: 'secondary' },
    ],
    menu: [
      { key: 'viewApplications', label: '查看申請' },
    ],
  },
  pending_activation: {
    primary: [
      { key: 'activateGroup',    label: '啟用服務', variant: 'primary'   },
      { key: 'manageMembers',    label: '管理成員', variant: 'secondary' },
    ],
    menu: [
      { key: 'viewPayments',     label: '收款狀態' },
    ],
  },
  active: {
    primary: [
      { key: 'viewPayments',     label: '收款狀態', variant: 'secondary' },
      { key: 'manageMembers',    label: '管理成員', variant: 'secondary' },
    ],
    menu: [
      { key: 'groupSettings',    label: '群組設定' },
    ],
  },
  active_renewal: {
    primary: [
      { key: 'prepareRenewal',   label: '準備續訂', variant: 'primary'   },
      { key: 'manageMembers',    label: '管理成員', variant: 'secondary' },
    ],
    menu: [
      { key: 'groupSettings',    label: '群組設定' },
    ],
  },
  paused: {
    primary: [
      { key: 'viewHistory',      label: '查看紀錄', variant: 'secondary' },
      { key: 'manageMembers',    label: '查看成員', variant: 'secondary' },
    ],
    menu: [
      { key: 'viewPayments',     label: '收款記錄' },
    ],
  },
  cancelled: {
    primary: [
      { key: 'viewHistory',      label: '查看紀錄', variant: 'secondary' },
      { key: 'manageMembers',    label: '查看成員', variant: 'secondary' },
    ],
    menu: [
      { key: 'viewPayments',     label: '收款記錄' },
    ],
  },
  ended: {
    primary: [
      { key: 'viewHistory',      label: '查看紀錄', variant: 'secondary' },
      { key: 'manageMembers',    label: '查看成員', variant: 'secondary' },
    ],
    menu: [
      { key: 'viewPayments',     label: '收款記錄' },
    ],
  },
}
