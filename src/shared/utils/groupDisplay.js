// 群組詳情頁共用的純資料/標籤輔助函式（與 GroupOverviewContent.jsx 分開，
// 避免該檔案同時匯出元件與常數/函式導致 React Fast Refresh 失效）。
import { Calendar, Play, Users } from 'lucide-react'

export const STATUS_LABELS = {
  recruiting:           '招募中',
  full:                 '已額滿',
  pending_confirmation: '等待確認',
  pending_activation:   '等待啟用',
  active:               '進行中',
  paused:               '已結束',
  cancelled:            '已結束',
  ended:                '已結束',
}

export function getPlanChips(group, plan) {
  if (!group) return []
  return [
    { icon: Calendar, label: '方案',     value: group.planName },
    { icon: Users,    label: '共享方式', value: `${group.totalSeats} 人共享` },
    ...((plan?.features?.length ?? 0) > 0
      ? [{ icon: Play, label: '主要功能', value: plan.features[0] }]
      : []),
  ]
}

export function getInfoRows(group) {
  if (!group) return []
  return [
    ...(group.requirements ? [{ label: '帳號需求', value: group.requirements }] : []),
    { label: '群組狀態', value: STATUS_LABELS[group.status] ?? group.status },
    { label: '建立時間', value: group.createdAt?.slice(0, 10).replace(/-/g, '/') ?? '—' },
  ]
}
