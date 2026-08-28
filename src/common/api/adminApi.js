import adminClient from './adminAxiosClient'

export async function adminLogin({ email, password }) {
  return adminClient.post('/admin/auth/login', { email, password })
}

export async function adminLogout() {
  return adminClient.post('/admin/auth/logout')
}

export async function fetchAdminMe() {
  return adminClient.get('/admin/auth/me')
}

export async function fetchAdminStats() {
  return adminClient.get('/admin/stats')
}

export async function fetchAdminDisputes(params = {}) {
  return adminClient.get('/admin/disputes', { params })
}

export async function fetchAdminDisputeDetail(disputeId) {
  return adminClient.get(`/admin/disputes/${disputeId}`)
}

export async function fetchAdminDisputeHistory(params = {}) {
  return adminClient.get('/admin/disputes/history', { params })
}

export async function adjudicateDisputeApi(groupId, { memberId, winner, reason }) {
  return adminClient.post(`/groups/${groupId}/adjudicate`, { memberId, winner, reason })
}
