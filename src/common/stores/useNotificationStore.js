import { create } from 'zustand'
import {
  readAllNotifications,
  insertNotification,
  patchNotification,
  markAllNotificationsRead,
} from '../api/notificationsApi'
import { useAuthStore } from './useAuthStore'
import { nowISO, todayISO, byNewest } from '../utils/date'
import { createId } from '../utils/storage'
import { startPolling } from '../utils/poller'
import { notifyError } from '../utils/toast'

const POLL_INTERVAL_MS = 10000

let _stopPolling = null
let _notifUserId = null

const SYSTEM_NOTIFICATION_TYPES = new Set(['system'])

// 保險去重：依 id 保留第一筆，避免 init/poll 交錯的競態情況讓同一筆通知在陣列中出現兩次
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
      message:   '你可以先探索群組與使用快速搜尋；登入後即可收藏、訂閱、建立與管理群組。',
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
        // teardown() 可能在這次 await 期間執行（例如使用者登出），此時不可再寫回 store，
        // 否則已登出的資料會在下一位使用者的畫面短暫重新出現
        if (!isActive() || _notifUserId !== polledForUserId) return
        const currentIds = new Set(useNotificationStore.getState().notifications.map(n => n.id))
        const newNotifs = latest.filter(n => n.userId === _notifUserId && !currentIds.has(n.id))
        // group_cancelled：團主解散群組後，不管是團主自己的其他分頁還是成員端，都要立刻讓畫面
        // 不再顯示已經不存在的招募中/額滿群組，不用等使用者點開這則通知才刷新
        if (newNotifs.some(n => n.type === 'member_removed' || n.type === 'member_left' || n.type === 'dispute_resolved' || n.type === 'group_cancelled')) {
          window.dispatchEvent(new CustomEvent('pm:refresh-member-stores'))
        }
        // 這幾種通知都代表 PM幣餘額剛被後端改動過（退款或撥款），不用等使用者點擊通知才更新，
        // 避免在點開通知之前，帳號中心/儲值 Modal 顯示的餘額是過期的舊值
        const BALANCE_AFFECTING_TYPES = new Set(['member_removed', 'application_rejected', 'escrow_released', 'dispute_resolved', 'group_cancelled'])
        if (newNotifs.some(n => BALANCE_AFFECTING_TYPES.has(n.type))) {
          useAuthStore.getState().refreshTokenBalance().catch(console.error)
        }
        if (newNotifs.some(n => n.type === 'new_application' || n.type === 'application_cancelled')) {
          window.dispatchEvent(new CustomEvent('pm:refresh-application-store'))
        }
        set({ notifications: dedupeById(latest) })
      } catch { /* silent */ }
    }, POLL_INTERVAL_MS)
  },

  teardown: () => {
    if (_stopPolling) { _stopPolling(); _stopPolling = null }
    _notifUserId = null
    set({ notifications: [] })
  },

  // ── 選取器 ──────────────────────────────────────────────────────────────────
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

  // ── 新增通知（本地推入 + 寫入後端，再將 tempId 替換成後端真實 ID）──────────
  create: async ({ userId, type, title, message, meta }) => {
    const tempId = createId('notif')
    const notif = {
      id:        tempId,
      userId,
      type,
      title,
      message,
      isRead:    false,
      createdAt: nowISO(),
      ...(meta ? { meta } : {}),
    }
    set(s => ({ notifications: [notif, ...s.notifications] }))
    try {
      const saved = await insertNotification(notif)
      if (saved?.id && saved.id !== tempId) {
        set(s => ({
          notifications: s.notifications.map(n => n.id === tempId ? { ...n, id: saved.id } : n),
        }))
        notif.id = saved.id
      }
    } catch (err) {
      console.error('[notificationStore] create failed:', err)
      // 後端寫入失敗時移除本地暫存通知，避免留下一筆 markRead 永遠無法同步的 tempId 幽靈通知
      set(s => ({ notifications: s.notifications.filter(n => n.id !== tempId) }))
    }
    return notif
  },

  // ── 標記單則已讀 ────────────────────────────────────────────────────────────
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

  // ── 全部標記已讀 ────────────────────────────────────────────────────────────
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
