import client from './axiosClient'

// 管理員對全平台使用者的系統聊天室發送同一則公告，回傳 { sent: 實際發送人數 }
export async function broadcastSystemMessage(content) {
  return client.post('/system-messages/broadcast', { content })
}

// 管理員對單一使用者的系統聊天室發送訊息
export async function sendDirectSystemMessage(userId, content) {
  return client.post('/system-messages/direct', { userId, content })
}
