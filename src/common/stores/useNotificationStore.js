import { create } from 'zustand'
import {
  readAllNotifications,
  patchNotification,
  markAllNotificationsRead,
} from '../api/notificationsApi'
import { useAuthStore } from './useAuthStore'
import { todayISO, byNewest } from '../utils/date'
import { startPolling } from '../utils/poller'
import { toast, notifyError } from '../utils/toast'

const POLL_INTERVAL_MS = 5000

let _stopPolling = null
let _notifUserId = null

const SYSTEM_NOTIFICATION_TYPES = new Set(['system'])

// 背景輪詢收到新通知時，只重新抓「這個通知類型真的會影響到的 store」，
// 不要每種類型都把 group/member/subscription/application 四個 store 全部重抓一次
const NOTIFICATION_REFRESH_STORES = {
  member_removed:          ['group', 'member'],
  member_left:              ['group', 'member'],
  group_cancelled:          ['group'],
  application_approved:     ['group', 'member', 'subscription', 'application'],
  application_rejected:     ['application'],
  all_service_info_filled:  ['group', 'member'],
  billing_date_confirmed:   ['group', 'member'],
  billing_date_adjusted:    ['group', 'member'],
  group_full_member:        ['group', 'member'],
  escrow_released_member:   ['group', 'member'],
}

function dedupeById(list) {
  const seen = new Set()
  return list.filter(n => {
    if (seen.has(n.id)) return false
    seen.add(n.id)
    return true
  })
}

function getFallbackSystemNotifications() {
  return [
    {
      id:        'system_guest_welcome',
      userId:    'system',
      type:      'system',
      title:     '歡迎來到 PartyMatch',
      message:   '你可以先探索群組與使用條件搜尋；登入後即可收藏、訂閱、建立與管理群組。',
      isRead:    true,
      createdAt: todayISO(),
      isPublic:  true,
    },
  ]
}

export function isSystemNotification(notification) {
  return (
    SYSTEM_NOTIFICATION_TYPES.has(notification.type) ||
    notification.isPublic === true ||
    !notification.userId
  )
}

function isPublicSystemNotification(notification) {
  const isPublic = notification.isPublic === true || !notification.userId
  return isPublic && isSystemNotification(notification)
}

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading:       false,
  error:         null,

  init: async () => {
    set({ loading: true, error: null })
    try {
      const notifications = await readAllNotifications()
      set({ notifications: dedupeById(notifications), loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  startPolling: (userId) => {
    if (_stopPolling) _stopPolling()
    _notifUserId = userId

    _stopPolling = startPolling(async (isActive) => {
      if (!_notifUserId) return
      const polledForUserId = _notifUserId
      try {
        const latest = await readAllNotifications()
        if (!isActive() || _notifUserId !== polledForUserId)
          return;
        const currentIds = new Set(useNotificationStore.getState().notifications.map(n => n.id))
        const newNotifs = latest.filter(n => n.userId === _notifUserId && !currentIds.has(n.id))
        const storesToRefresh = new Set()
        newNotifs.forEach(n => {
          NOTIFICATION_REFRESH_STORES[n.type]?.forEach(store => storesToRefresh.add(store))
        })
        if (storesToRefresh.size > 0) {
          window.dispatchEvent(new CustomEvent('pm:refresh-stores', { detail: { stores: [...storesToRefresh] } }))
        }
        const BALANCE_AFFECTING_TYPES = new Set(['member_removed', 'application_rejected', 'escrow_released', 'dispute_resolved', 'group_cancelled']);
        if (newNotifs.some(n => BALANCE_AFFECTING_TYPES.has(n.type))) {
          useAuthStore.getState().refreshTokenBalance().catch(console.error)
        }
        if (newNotifs.some(n => n.type === 'new_application' || n.type === 'application_cancelled')) {
          window.dispatchEvent(new CustomEvent('pm:refresh-application-store'))
        }
        // 申請結果（通過或未通過，不管是團主手動處理還是群組額滿被系統自動拒絕）主動跳一次提示，
        // 不要讓使用者只能在探索頁看到卡片默默消失/變成會員狀態、或是自己點進通知中心才發現
        newNotifs.filter(n => n.type === 'application_approved' || n.type === 'application_rejected').forEach(n => {
          toast(n.title, n.type === 'application_approved' ? 'success' : 'info', {
            action: { label: '前往我的訂閱', onClick: () => window.dispatchEvent(new CustomEvent('pm:navigate', { detail: { path: '/my-subscriptions' } })) },
          })
        })
        set({ notifications: dedupeById(latest) })
      } catch {}
    }, POLL_INTERVAL_MS)
  },

  teardown: () => {
    if (_stopPolling) { _stopPolling(); _stopPolling = null }
    _notifUserId = null
    set({ notifications: [] })
  },

  getByUserId: (userId) =>
    get().notifications.filter(n => n.userId === userId).sort(byNewest),

  getSystemNotifications: () => {
    const systemNotifications = get().notifications
      .filter(isPublicSystemNotification)
      .sort(byNewest)
    return systemNotifications.length > 0 ? systemNotifications : getFallbackSystemNotifications()
  },

  getUnreadCount: (userId) => {
    if (!userId) return 0
    return get().notifications.filter(n => n.userId === userId && !n.isRead).length
  },


  markRead: (id) => {
    const prior = get().notifications.find(n => n.id === id) ?? null
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
    }))
    patchNotification(id).catch(err => {
      if (prior) set(s => ({ notifications: s.notifications.map(n => n.id === id ? prior : n) }))
      notifyError(err, '標記已讀失敗，請稍後再試')
    })
  },

  markAllRead: (userId) => {
    const priors = get().notifications.filter(n => n.userId === userId)
    set(s => ({
      notifications: s.notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n),
    }))
    markAllNotificationsRead().catch(err => {
      set(s => ({
        notifications: s.notifications.map(n => priors.find(p => p.id === n.id) ?? n),
      }))
      notifyError(err, '全部標記已讀失敗，請稍後再試')
    })
  },
}))
