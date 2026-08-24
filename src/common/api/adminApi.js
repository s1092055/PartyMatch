import client from './axiosClient'

export async function fetchAdminStats() {
  return client.get('/admin/stats')
}

export async function fetchAdminDisputes(params = {}) {
  return client.get('/admin/disputes', { params })
}

export async function fetchAdminDisputeDetail(disputeId) {
  return client.get(`/admin/disputes/${disputeId}`)
}

export async function fetchAdminDisputeHistory(params = {}) {
  return client.get('/admin/disputes/history', { params })
}
