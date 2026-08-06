import client from './axiosClient'

export async function fetchAdminStats() {
  return client.get('/admin/stats')
}
