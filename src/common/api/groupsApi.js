import client from './axiosClient'

export async function readAllGroups(params = {}) {
  return client.get('/groups', { params })
}

export async function insertGroup(data) {
  return client.post('/groups', data)
}

// 查詢單一群組最新狀態；後端在這裡順帶處理「確認期已逾期就自動撥款」的惰性檢查，
// 所以開啟群組詳情時應該打這支，不能只讀本地快取
export async function fetchGroupById(id) {
  return client.get(`/groups/${id}`)
}

export async function patchGroup(id, patch) {
  return client.patch(`/groups/${id}`, patch)
}

export async function lockGroupApi(id, sharedCredentials) {
  return client.post(`/groups/${id}/lock`, sharedCredentials ? { sharedCredentials } : undefined)
}

export async function activateGroupApi(id) {
  return client.post(`/groups/${id}/activate`)
}

export async function confirmGroupApi(id) {
  return client.post(`/groups/${id}/confirm`)
}

export async function adjustBillingDateApi(id, { nextBillingDate, note }) {
  return client.patch(`/groups/${id}/billing-date`, { nextBillingDate, note })
}

export async function cancelGroupApi(id) {
  return client.post(`/groups/${id}/cancel`)
}

export async function disputeGroupApi(id, { reason, evidenceUrl }) {
  return client.post(`/groups/${id}/dispute`, { reason, evidenceUrl })
}

export async function adjudicateGroupApi(id, { winner, reason }) {
  return client.post(`/groups/${id}/adjudicate`, { winner, reason })
}

export async function resolveDisputeApi(id, { note } = {}) {
  return client.post(`/groups/${id}/resolve-dispute`, { note })
}

export async function renewGroupApi(id) {
  return client.post(`/groups/${id}/renew`)
}

export async function fetchGroupTransactions(id) {
  return client.get(`/groups/${id}/transactions`)
}
