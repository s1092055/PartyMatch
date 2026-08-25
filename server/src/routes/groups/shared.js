import prisma from '../../lib/prisma.js'
import { appendMessage } from '../../lib/conversationMessages.js'
import { NOTIFICATION_CATEGORIES } from '../../lib/notificationCategories.js'

export async function notifyGroupConversation(groupId, senderId, content) {
  const conversation = await prisma.conversation.findFirst({ where: { groupId, type: 'group' } })
  if (!conversation) return
  await appendMessage(conversation, { senderId, content, type: 'system' })
}

export async function notify({ userId, type, title, message, meta }) {
  try {
    const category = NOTIFICATION_CATEGORIES[type]
    if (category && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { mutedNotificationCategories: true } })
      if ((user?.mutedNotificationCategories ?? []).includes(category)) return
    }
    await prisma.notification.create({ data: { userId, type, title, message, meta } })
  } catch (err) {
    console.error(err)
  }
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
