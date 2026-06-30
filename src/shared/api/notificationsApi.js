import client from './axiosClient'

export async function readAllNotifications() {
  return client.get('/notifications')
}

export async function insertNotification(data) {
  return client.post('/notifications', data)
}

export async function patchNotification(id, patch) {
  if (patch.isRead) return client.patch(`/notifications/${id}/read`)
  return client.patch(`/notifications/${id}`, patch)
}

export async function markAllNotificationsRead() {
  return client.patch('/notifications/read-all')
}
