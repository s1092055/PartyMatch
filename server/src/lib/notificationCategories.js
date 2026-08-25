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
}

export const MUTABLE_NOTIFICATION_CATEGORY_KEYS = ['application', 'group', 'billing']
