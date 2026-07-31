import { PROCESSING_STATUSES } from '../../../common/utils/groupStatus'

// 曾經拆成跟 GroupStatus 一一對應的細分類（待鎖定／成員填寫中／待啟用／確認期中／申訴中各自一個
// chip），但頂部一次塞 8 個 chip 反而讓篩選列很雜亂；這些細分階段其實卡片本身的狀態 badge
// 已經會顯示，篩選列只留大分類，細節交給卡片呈現就好
export const STATUS_FILTER_TABS = [
  { key: 'recruiting', label: '招募中' },
  { key: 'processing', label: '處理中' },
  { key: 'active',     label: '服務中' },
]

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
