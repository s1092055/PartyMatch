import prisma from '../../lib/prisma.js'
import { appendMessage } from '../../lib/conversationMessages.js'
import { NOTIFICATION_CATEGORIES, ALWAYS_SEND_NOTIFICATION_TYPES } from '../../lib/notificationCategories.js'

export async function notifyGroupConversation(groupId, senderId, content) {
  const conversation = await prisma.conversation.findFirst({ where: { groupId, type: 'group' } })
  if (!conversation) return
  await appendMessage(conversation, { senderId, content, type: 'system' })
}

function isCategoryMuted(mutedCategories, type) {
  const category = NOTIFICATION_CATEGORIES[type]
  return category ? (mutedCategories ?? []).includes(category) : false
}

function warnIfUnknownType(type) {
  if (!NOTIFICATION_CATEGORIES[type] && !ALWAYS_SEND_NOTIFICATION_TYPES.includes(type)) {
    console.warn(`[notify] 通知類型 "${type}" 沒有出現在 NOTIFICATION_CATEGORIES 也沒有出現在 ALWAYS_SEND_NOTIFICATION_TYPES，請補上其中一邊`)
  }
}

export async function notify({ userId, type, title, message, meta }) {
  try {
    warnIfUnknownType(type)
    if (userId && NOTIFICATION_CATEGORIES[type]) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { mutedNotificationCategories: true } })
      if (isCategoryMuted(user?.mutedNotificationCategories, type)) return
    }
    await prisma.notification.create({ data: { userId, type, title, message, meta } })
  } catch (err) {
    console.error(err)
  }
}

// 一次建立多筆通知（例如廣播給整個群組成員，或同一個使用者的多筆提醒），
// 一次查完所有涉及使用者的靜音設定，避免每筆各自打一次 DB
export async function notifyBatch(items) {
  try {
    if (items.length === 0) return
    items.forEach(item => warnIfUnknownType(item.type))
    const userIds = [...new Set(items.map(i => i.userId))]
    const users = await prisma.user.findMany({
      where:  { id: { in: userIds } },
      select: { id: true, mutedNotificationCategories: true },
    })
    const mutedById = new Map(users.map(u => [u.id, u.mutedNotificationCategories]))
    const data = items.filter(item => !isCategoryMuted(mutedById.get(item.userId), item.type))
    if (data.length > 0) await prisma.notification.createMany({ data })
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
