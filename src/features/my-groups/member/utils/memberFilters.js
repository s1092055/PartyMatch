import { isEffectivelyActive } from '../../../../shared/utils/groupStatus'

// 「處理中」原本一次塞了 full/pending_confirmation/pending_activation/confirming/disputed
// 五種完全不同的階段，太籠統分不清自己現在該做什麼；拆成跟群組實際狀態一一對應的分類。
// 「審核中」比較特殊：對應的是還沒被核准、根本還沒有 Subscription 記錄的申請本身
export const FILTER_TABS = [
  { key: 'all',                  label: '全部'     },
  { key: 'applying',             label: '審核中'   },
  { key: 'recruiting',           label: '招募中'   },
  { key: 'full',                 label: '待鎖定'   },
  { key: 'pending_confirmation', label: '填寫資訊中' },
  { key: 'pending_activation',   label: '待啟用'   },
  { key: 'confirming',           label: '確認期中' },
  { key: 'disputed',             label: '申訴中'   },
  { key: 'active',               label: '服務中'   },
]

// 自己已經確認過服務時，即使群組整體仍在 confirming，個人視角也提前算「服務中」
export function subscriptionBucket(sub) {
  const status = sub.groupStatus ?? sub.status
  if (isEffectivelyActive(status, sub.confirmedAt)) return 'active'
  return status
}
