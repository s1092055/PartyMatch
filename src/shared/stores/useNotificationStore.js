import { create } from 'zustand'
import {
  readAllNotifications,
  insertNotification,
  patchNotification,
  markAllNotificationsRead,
} from '../api/notificationsApi'
import { nowISO, todayISO } from '../utils/date'
import { createId } from '../utils/storage'

const POLL_INTERVAL_MS = 10000

let _notifTimer = null
let _notifUserId = null

const SYSTEM_NOTIFICATION_TYPES = new Set(['system', 'announcement', 'platform'])

function byNewest(a, b) {
  return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
}

function getFallbackSystemNotifications() {
  return [
    {
      id:        'system_guest_welcome',
      userId:    'system',
      type:      'system',
      title:     '歡迎來到 PartyMatch',
      message:   '你可以先探索群組與使用快速查找；登入後即可收藏、訂閱、建立與管理群組。',
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
    notification.audience === 'public' ||
    notification.scope === 'public' ||
    notification.userId === 'system' ||
    !notification.userId
  )
}

function isPublicSystemNotification(notification) {
  const isPublic =
    notification.isPublic === true ||
    notification.audience === 'public' ||
    notification.scope === 'public' ||
    notification.userId === 'system' ||
    !notification.userId
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
      set({ notifications, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  startPolling: (userId) => {
    if (_notifTimer) clearInterval(_notifTimer)
    _notifUserId = userId

    async function poll() {
      if (!_notifUserId) return
      try {
        const latest = await readAllNotifications()
        const currentIds = new Set(useNotificationStore.getState().notifications.map(n => n.id))
        const newNotifs = latest.filter(n => n.userId === _notifUserId && !currentIds.has(n.id))
        if (newNotifs.some(n => n.type === 'member_removed' || n.type === 'member_left')) {
          window.dispatchEvent(new CustomEvent('pm:refresh-member-stores'))
        }
        if (newNotifs.some(n => n.type === 'new_application')) {
          window.dispatchEvent(new CustomEvent('pm:refresh-application-store'))
        }
        set({ notifications: latest })
      } catch { /* silent */ }
    }

    _notifTimer = setInterval(poll, POLL_INTERVAL_MS)
  },

  teardown: () => {
    if (_notifTimer) { clearInterval(_notifTimer); _notifTimer = null }
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
    }
    return notif
  },

  // ── 標記單則已讀 ────────────────────────────────────────────────────────────
  markRead: (id) => {
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
    }))
    patchNotification(id).catch(console.error)
  },

  // ── 全部標記已讀 ────────────────────────────────────────────────────────────
  markAllRead: (userId) => {
    set(s => ({
      notifications: s.notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n),
    }))
    markAllNotificationsRead().catch(console.error)
  },
}))
