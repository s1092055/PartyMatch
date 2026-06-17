import { readAllNotifications, subscribeToUserNotifications, insertNotification, patchNotification } from '../api/notificationsApi'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'

let _notifications = []
let _liveNotifications = null
let _unsub = null
let _subscribedUserId = null

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
      message:   '你可以先探索群組與使用快速配對；登入後即可收藏、訂閱、建立與管理群組。',
      isRead:    true,
      createdAt: todayISO(),
      isPublic:  true,
    },
  ]
}

export async function initNotifications() {
  _notifications = await readAllNotifications()
}

export function initUserNotifications(userId) {
  teardownUserNotifications()
  _subscribedUserId = userId
  _unsub = subscribeToUserNotifications(userId, notifications => {
    _liveNotifications = notifications
    window.dispatchEvent(new CustomEvent('pm:notif-changed'))
  })
}

export function teardownUserNotifications() {
  if (_unsub) { _unsub(); _unsub = null }
  _liveNotifications = null
  _subscribedUserId = null
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

export function getSystemNotifications() {
  const systemNotifications = _notifications
    .filter(isPublicSystemNotification)
    .sort(byNewest)

  return systemNotifications.length > 0
    ? systemNotifications
    : getFallbackSystemNotifications()
}

export function getNotifications(userId) {
  const source = _liveNotifications ?? _notifications.filter(n => n.userId === userId)
  return [...source].sort(byNewest)
}

export function createNotification({ userId, type, title, message }) {
  const notif = {
    id:        createId('notif'),
    userId,
    type,
    title,
    message,
    isRead:    false,
    createdAt: todayISO(),
  }
  _notifications.unshift(notif)
  if (_liveNotifications !== null && userId === _subscribedUserId) {
    _liveNotifications = [notif, ..._liveNotifications]
  }
  insertNotification(notif).catch(console.error)
  window.dispatchEvent(new CustomEvent('pm:notif-changed'))
  return notif
}

export function getUnreadCount(userId) {
  if (!userId) return 0
  const source = _liveNotifications ?? _notifications.filter(n => n.userId === userId)
  return source.filter(n => !n.isRead).length
}

export function markNotificationAsRead(id) {
  _notifications = _notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
  if (_liveNotifications) _liveNotifications = _liveNotifications.map(n => n.id === id ? { ...n, isRead: true } : n)
  patchNotification(id, { isRead: true }).catch(console.error)
  window.dispatchEvent(new CustomEvent('pm:notif-changed'))
}

export function markAllAsRead(userId) {
  const source = _liveNotifications ?? _notifications.filter(n => n.userId === userId)
  const unread = source.filter(n => !n.isRead)
  _notifications = _notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n)
  if (_liveNotifications) _liveNotifications = _liveNotifications.map(n => ({ ...n, isRead: true }))
  unread.forEach(n => patchNotification(n.id, { isRead: true }).catch(console.error))
  window.dispatchEvent(new CustomEvent('pm:notif-changed'))
}
