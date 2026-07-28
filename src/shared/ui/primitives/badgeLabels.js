export const BADGE_VARIANTS = {
  recruiting:           'bg-success-subtle text-success-text',
  pending_activation:   'bg-warning-subtle text-warning-text',
  active:               'bg-success-subtle text-success-text',
  cancelled:            'bg-danger-subtle text-danger-text',
  full:                 'bg-raised text-ink-2',
  pending_confirmation: 'bg-warning-subtle text-warning-text',
  active_renewal:       'bg-success-subtle text-success-text',
  confirming:           'bg-info-subtle text-info-text',
  disputed:             'bg-danger-subtle text-danger-text',
  ended:                'bg-slate-100 text-slate-400',
  closed:               'bg-danger-subtle text-danger-text',
  approval:             'bg-info-subtle text-info-text',
  pending:              'bg-warning-subtle text-warning-text',
  verified:             'bg-info-subtle text-info-text',
  upcoming:             'bg-brand-subtle text-brand',
  member_joined:        'bg-success-subtle text-success-text',
  default:              'bg-raised text-ink-2',
}

// 取某狀態的文字顏色（不含背景），給其他地方（如 HostedGroupCard 的 highlight）沿用同一份色彩，
// 避免另外手刻一份對照表跟這裡的顏色不同步
export function getStatusTextColor(variant) {
  const cls = BADGE_VARIANTS[variant] ?? BADGE_VARIANTS.default
  return cls.split(' ').find(c => c.startsWith('text-')) ?? 'text-ink-2'
}

export const BADGE_LABELS = {
  recruiting:         '招募中',
  pending_activation: '待啟用',
  active:             '服務中',
  cancelled:          '已解散',
  full:               '已滿員',
  pending_confirmation: '成員填寫中',
  confirming:           '確認期中',
  disputed:             '問題處理中',
  ended:              '已結束',
  closed:             '已關閉',
  approval:           '審核加入',
  pending:            '待確認',
  verified:           '已驗證',
  upcoming:           '即將續訂',
  member_joined:      '申請通過',
  active_renewal:     '即將續訂',
}
