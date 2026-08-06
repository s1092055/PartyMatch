import client from './axiosClient'

export async function fetchCredentialComments(groupId) {
  return client.get(`/credential-comments/${groupId}`)
}

export async function createCredentialComment({ groupId, content, attachmentUrl }) {
  return client.post('/credential-comments', { groupId, content, ...(attachmentUrl && { attachmentUrl }) })
}
