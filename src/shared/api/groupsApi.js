import client from './axiosClient'

export async function readAllGroups(params = {}) {
  return client.get('/groups', { params })
}

export async function insertGroup(data) {
  return client.post('/groups', data)
}

export async function patchGroup(id, patch) {
  return client.patch(`/groups/${id}`, patch)
}

export async function lockGroupApi(id) {
  return client.post(`/groups/${id}/lock`)
}

export async function activateGroupApi(id) {
  return client.post(`/groups/${id}/activate`)
}

export async function confirmGroupApi(id) {
  return client.post(`/groups/${id}/confirm`)
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

export async function renewGroupApi(id) {
  return client.post(`/groups/${id}/renew`)
}

export async function fetchGroupTransactions(id) {
  return client.get(`/groups/${id}/transactions`)
}
