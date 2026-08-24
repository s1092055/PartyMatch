import prisma from './prisma.js'
import { appendMessage } from './conversationMessages.js'

const SYSTEM_USER_EMAIL = 'system@partymatch.internal'

let cachedSystemUserId = null

export async function getSystemUserId() {
  if (cachedSystemUserId) return cachedSystemUserId

  const user = await prisma.user.upsert({
    where:  { email: SYSTEM_USER_EMAIL },
    // isSystem 加欄位前就已建立過這筆帳號的環境，第一次呼叫時順便補標記、拿掉誤設的 isAdmin
    update: { isSystem: true, isAdmin: false },
    create: {
      email:         SYSTEM_USER_EMAIL,
      name:          'PartyMatch 系統訊息',
      phone:         '0000000000',
      avatarInitial: 'P',
      avatarColor:   'linear-gradient(135deg,#667eea,#764ba2)',
      isSystem:      true,
    },
    select: { id: true },
  })
  cachedSystemUserId = user.id
  return cachedSystemUserId
}

export async function getOrCreateSystemConversation(userId) {
  const existing = await prisma.conversation.findFirst({
    where: { type: 'system', participants: { array_contains: userId } },
  })
  if (existing) return existing

  return prisma.conversation.create({
    data: { type: 'system', participants: [userId] },
  })
}

export async function deliverSystemMessage(conversation, content) {
  const senderId = await getSystemUserId()
  return appendMessage(conversation, { senderId, content })
}

export async function sendSystemMessageToUser(userId, content) {
  const conversation = await getOrCreateSystemConversation(userId)
  return deliverSystemMessage(conversation, content)
}

const WELCOME_MESSAGE = '歡迎加入 PartyMatch！這裡是系統通知聊天室，平台公告與客服回覆都會顯示在這裡。'

export async function ensureSystemConversation(userId) {
  const existing = await prisma.conversation.findFirst({
    where: { type: 'system', participants: { array_contains: userId } },
  })
  if (existing) {
    if (existing.lastMessage == null) await deliverSystemMessage(existing, WELCOME_MESSAGE)
    return existing
  }

  const conversation = await prisma.conversation.create({
    data: { type: 'system', participants: [userId] },
  })
  await deliverSystemMessage(conversation, WELCOME_MESSAGE)
  return conversation
}
