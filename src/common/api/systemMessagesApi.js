import client from './axiosClient'

export async function broadcastSystemMessage(content) {
  return client.post('/system-messages/broadcast', { content })
}

export async function sendDirectSystemMessage(userId, content) {
  return client.post('/system-messages/direct', { userId, content })
}
