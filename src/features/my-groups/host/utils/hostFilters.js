import { isHistoryGroup } from '../../../../shared/utils/groupStatusDisplay'

// 「處理中」原本一次塞 full/pending_confirmation/pending_activation 三種完全不同階段，
// 「啟用中」也塞了 active/confirming/disputed，太籠統分不清群組實際卡在哪個環節；
// 拆成跟 GroupStatus 一一對應的分類，一眼就能看出這個群組現在需要做什麼
export const STATUS_FILTER_TABS = [
  { key: 'all',                  label: '全部'     },
  { key: 'recruiting',           label: '招募中'   },
  { key: 'full',                 label: '待鎖定'   },
  { key: 'pending_confirmation', label: '填寫資訊中' },
  { key: 'pending_activation',   label: '待啟用'   },
  { key: 'confirming',           label: '確認期中' },
  { key: 'disputed',             label: '申訴中'   },
  { key: 'active',               label: '服務中'   },
]

export function matchesFilter(group, filterKey) {
  if (filterKey === 'all') return !isHistoryGroup(group)
  return group.status === filterKey
}

export function calcApprovalSeatPatch(seats, alreadyMember) {
  if (alreadyMember) return null
  const newUsedSeats = seats.usedSeats + 1
  const newOpenSeats = seats.openSeats - 1
  return { usedSeats: newUsedSeats, openSeats: newOpenSeats, ...(newOpenSeats === 0 ? { status: 'full' } : {}) }
}
