import { isEffectivelyActive, PROCESSING_STATUSES } from '../../../../shared/utils/groupStatus'

// 曾經拆成跟群組實際狀態一一對應的細分類（待鎖定／填寫資訊中／待啟用／確認期中／申訴中，
// 連還沒核准的「審核中」申請也自己一個 chip），但頂部一次塞太多 chip 反而顯得雜亂；這些細分
// 階段其實卡片本身的狀態 badge 已經會顯示，篩選列只留大分類，細節交給卡片呈現就好。
// 「審核中」的申請（還沒有 Subscription 記錄）併入「處理中」一起顯示
export const FILTER_TABS = [
  { key: 'recruiting', label: '招募中' },
  { key: 'processing', label: '處理中' },
  { key: 'active',     label: '服務中' },
]

// 自己已經確認過服務時，即使群組整體仍在 confirming，個人視角也提前算「服務中」
export function subscriptionBucket(sub) {
  const status = sub.groupStatus ?? sub.status
  if (isEffectivelyActive(status, sub.confirmedAt)) return 'active'
  return PROCESSING_STATUSES.has(status) ? 'processing' : status
}
