// 群組詳情頁共用的純資料/標籤輔助函式（與 GroupOverviewContent.jsx 分開，
// 避免該檔案同時匯出元件與常數/函式導致 React Fast Refresh 失效）。
import { Calendar, Play, Users } from 'lucide-react'

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
    { label: '群組狀態', badge: group.status },
    { label: '建立時間', value: group.createdAt?.slice(0, 10).replace(/-/g, '/') ?? '—' },
    { label: '帳號需求', value: group.requirements || '無' },
  ]
}
