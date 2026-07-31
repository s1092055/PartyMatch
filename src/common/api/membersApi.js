import client from './axiosClient'

export async function readAllMembers(params = {}) {
  return client.get('/members', { params })
}

export async function patchMember(id, patch) {
  return client.patch(`/members/${id}`, patch)
}

export async function deleteMemberRecord(id) {
  return client.delete(`/members/${id}`)
}
