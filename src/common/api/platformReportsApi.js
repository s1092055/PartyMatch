import client from './axiosClient'

export async function createPlatformReport({ groupId, description, evidenceUrl }) {
  return client.post('/platform-reports', { groupId, description, evidenceUrl })
}
