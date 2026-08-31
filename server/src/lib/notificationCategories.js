// 可被使用者靜音的通知類別。未列在這裡的類型（爭議、服務資訊問題、系統通知）一律強制發送，不可關閉。
export const NOTIFICATION_CATEGORIES = {
  application_sent:      'application',
  application_approved:  'application',
  application_rejected:  'application',
  application_cancelled: 'application',
  new_application:       'application',

  group_created:            'group',
  group_activated:          'group',
  group_chat_opened:        'group',
  group_full:                'group',
  group_ended:               'group',
  group_cancelled:           'group',
  group_renewal:             'group',
  member_left:               'group',
  member_removed:            'group',
  member_confirmed_service:  'group',
  group_reviewed:            'group',

  fill_service_info:             'billing',
  service_info_filled:           'billing',
  all_service_info_filled:       'billing',
  service_info_deadline_passed:  'billing',
  escrow_released:               'billing',
  upcoming_renewal:              'billing',
  billing_date_confirmed:        'billing',
  billing_date_adjusted:         'billing',
  payment_reminder:              'billing',
}

export const MUTABLE_NOTIFICATION_CATEGORY_KEYS = ['application', 'group', 'billing']

// 刻意排除在 NOTIFICATION_CATEGORIES 之外、一律強制發送的類型。
// 新增 NotificationType enum 值時記得二選一：加進 NOTIFICATION_CATEGORIES，或加進這裡；
// 兩邊都沒加會在 notify() 觸發 console.warn，避免靜默變成「使用者無法靜音」。
export const ALWAYS_SEND_NOTIFICATION_TYPES = [
  'dispute_raised',
  'dispute_resolved',
  'dispute_resolved_by_host',
  'service_info_issue',
  'account_reactivated',
  'system',
]
