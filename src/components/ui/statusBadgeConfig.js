import { badgeVariantClasses } from './badge'

// 群組/訂閱/申請等業務狀態 → 視覺 variant／預設文字對照表。跟 Badge 的視覺
// variant（default/secondary/destructive/...）分開維護，方便之後新增狀態時
// 不用動 Badge 本身的視覺定義
export const STATUS_CONFIG = {
  recruiting:           { variant: 'success',     label: '招募中' },
  pending_activation:   { variant: 'warning',     label: '待啟用' },
  active:               { variant: 'success',     label: '服務中' },
  cancelled:            { variant: 'destructive', label: '已解散' },
  full:                 { variant: 'secondary',   label: '已滿員' },
  pending_confirmation: { variant: 'warning',     label: '成員填寫中' },
  confirming:           { variant: 'info',        label: '確認期中' },
  disputed:             { variant: 'destructive', label: '問題處理中' },
  ended:                { variant: 'neutral',     label: '已結束' },
  closed:               { variant: 'destructive', label: '已關閉' },
  approval:             { variant: 'info',        label: '審核加入' },
  pending:              { variant: 'warning',     label: '待確認' },
  verified:             { variant: 'info',        label: '已驗證' },
  upcoming:             { variant: 'default',     label: '即將續訂' },
  member_joined:        { variant: 'success',     label: '申請通過' },
  active_renewal:       { variant: 'success',     label: '即將續訂' },
}
export const DEFAULT_STATUS_CONFIG = { variant: 'secondary', label: null }

// 取某狀態的預設文字（不包 Badge），給需要純文字顯示（不需要色塊）的地方沿用
export function getStatusLabel(status) {
  return STATUS_CONFIG[status]?.label ?? status
}

// 取某狀態的文字顏色（不含背景），給其他地方（如 HostedGroupCard 的 highlight）沿用同一份色彩，
// 避免另外手刻一份對照表跟這裡的顏色不同步
export function getStatusTextColor(status) {
  const config = STATUS_CONFIG[status] ?? DEFAULT_STATUS_CONFIG
  const cls = badgeVariantClasses[config.variant] ?? badgeVariantClasses.secondary
  return cls.split(' ').find(c => c.startsWith('text-')) ?? 'text-ink-2'
}
