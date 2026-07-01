import client from './axiosClient'

export async function readAllNotifications() {
  return client.get('/notifications')
}

export async function insertNotification(data) {
  return client.post('/notifications', data)
}

export async function patchNotification(id) {
  return client.patch(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead() {
  return client.patch('/notifications/read-all')
}
