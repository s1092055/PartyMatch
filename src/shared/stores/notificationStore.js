import { readAllNotifications, insertNotification, patchNotification } from '../api/notificationsApi'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'

let _notifications = []

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export async function initNotifications() {
  const all = await readAllNotifications()
  _notifications = DEMO_MODE ? all : all.filter(n => !n._demo)
}

export function getNotifications(userId) {
  return _notifications.filter(n => n.userId === userId)
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

export function markNotificationAsRead(id) {
  _notifications = _notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
  patchNotification(id, { isRead: true }).catch(console.error)
}

export function markAllAsRead(userId) {
  const unread = _notifications.filter(n => n.userId === userId && !n.isRead)
  _notifications = _notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n)
  unread.forEach(n => patchNotification(n.id, { isRead: true }).catch(console.error))
}
