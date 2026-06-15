import { readAllNotifications, insertNotification, patchNotification } from '../api/notificationsApi'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'

let _notifications = []

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
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
  const all = await readAllNotifications()
  _notifications = DEMO_MODE ? all : all.filter(n => !n._demo)
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
  return _notifications.filter(n => n.userId === userId).sort(byNewest)
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
  insertNotification(notif).catch(console.error)
  return notif
}

export function getUnreadCount(userId) {
  if (!userId) return 0
  return _notifications.filter(n => n.userId === userId && !n.isRead).length
}

export function markNotificationAsRead(id) {
  _notifications = _notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
  patchNotification(id, { isRead: true }).catch(console.error)
  window.dispatchEvent(new CustomEvent('pm:notif-changed'))
}

export function markAllAsRead(userId) {
  const unread = _notifications.filter(n => n.userId === userId && !n.isRead)
  _notifications = _notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n)
  unread.forEach(n => patchNotification(n.id, { isRead: true }).catch(console.error))
  window.dispatchEvent(new CustomEvent('pm:notif-changed'))
}
