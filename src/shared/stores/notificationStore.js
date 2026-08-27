import { readAllNotifications, saveAllNotifications, insertNotification, patchNotification, markAllRead } from '../api/notificationsApi'
import { todayISO } from '../utils/date'
import { createId } from '../utils/storage'
import { getActiveUser } from './userStore'

function offsetDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return todayISO(d)
}

function seedNotificationsForUser(userId) {
  return [
    {
      id:        `notif_seed_${userId}_payment`,
      userId,
      type:      'payment_reminder',
      title:     '付款提醒',
      message:   'Spotify Premium 將於 3 天後扣款（NT$58）',
      isRead:    false,
      createdAt: offsetDate(3),
    },
    {
      id:        `notif_seed_${userId}_approved`,
      userId,
      type:      'application_approved',
      title:     '申請通過',
      message:   '您申請加入的 Netflix 群組已通過審核',
      isRead:    true,
      createdAt: offsetDate(-7),
    },
    {
      id:        `notif_seed_${userId}_application`,
      userId,
      type:      'new_application',
      title:     '新申請通知',
      message:   '有新成員申請加入您的 Amazon Prime Video 群組',
      isRead:    false,
      createdAt: offsetDate(-2),
    },
  ]
}

export function getNotifications(userId) {
  const all     = readAllNotifications()
  const current = all.filter(n => n.userId === userId)
  if (current.length > 0) return current
  const seeded = seedNotificationsForUser(userId)
  saveAllNotifications([...all, ...seeded])
  return seeded
}

export function getUnreadCount(userId) {
  return readAllNotifications().filter(n => n.userId === userId && !n.isRead).length
}

export function createNotification({ userId, type, title, message }) {
  return insertNotification({
    id:        createId('notif'),
    userId,
    type,
    title,
    message,
    isRead:    false,
    createdAt: todayISO(),
  })
}

export function markNotificationAsRead(id) {
  patchNotification(id, { isRead: true })
}

export function markAllAsRead(userId) {
  markAllRead(userId)
}

export function getCurrentUserNotifications() {
  const user = getActiveUser()
  return user ? getNotifications(user.id) : []
}
