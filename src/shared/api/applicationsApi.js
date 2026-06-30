import client from './axiosClient'

export async function readAllApplications(params = {}) {
  return client.get('/applications', { params })
}

export async function insertApplication(data) {
  return client.post('/applications', data)
}

export async function patchApplication(id, patch) {
  return client.patch(`/applications/${id}`, patch)
}
