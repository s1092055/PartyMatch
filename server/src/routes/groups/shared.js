import prisma from '../../lib/prisma.js'
import { appendMessage } from '../../lib/conversationMessages.js'

export async function notifyGroupConversation(groupId, senderId, content) {
  const conversation = await prisma.conversation.findFirst({ where: { groupId, type: 'group' } })
  if (!conversation) return
  await appendMessage(conversation, { senderId, content, type: 'system' })
}

export function notify({ userId, type, title, message, meta }) {
  prisma.notification.create({ data: { userId, type, title, message, meta } }).catch(console.error)
}

export async function claimGroupStatus(
  tx,
  groupId,
  { fromStatus, data, message = '群組狀態已變動，請重新整理頁面', responseCode }
) {
  const claimed = await tx.group.updateMany({
    where: { id: groupId, status: Array.isArray(fromStatus) ? { in: fromStatus } : fromStatus },
    data,
  })
  if (claimed.count === 0) {
    const err = new Error(message)
    err.statusCode = 409
    if (responseCode) err.responseCode = responseCode
    throw err
  }
}
