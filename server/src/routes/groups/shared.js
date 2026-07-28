import prisma from '../../lib/prisma.js'
import { appendMessage } from '../../lib/conversationMessages.js'

// 找出群組聊天室並附加一則系統訊息；建立時機早於群組鎖定的情境（例如群組還沒鎖定）不會有聊天室，此時靜默略過
export async function notifyGroupConversation(groupId, senderId, content) {
  const conversation = await prisma.conversation.findFirst({ where: { groupId, type: 'group' } })
  if (!conversation) return
  await appendMessage(conversation, { senderId, content, type: 'system' })
}

// 建立單則通知，fire-and-forget（不阻塞主要回應，失敗只記 log）
export function notify({ userId, type, title, message, meta }) {
  prisma.notification.create({ data: { userId, type, title, message, meta } }).catch(console.error)
}
