import client from './axiosClient'

export async function readAllGroups(params = {}) {
  return client.get('/groups', { params })
}

export async function readGroupById(id) {
  return client.get(`/groups/${id}`)
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

export async function deleteGroup(id) {
  return client.delete(`/groups/${id}`)
}
