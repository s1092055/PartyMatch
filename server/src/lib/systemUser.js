import prisma from './prisma.js'
import { appendMessage } from './conversationMessages.js'

const SYSTEM_USER_EMAIL = 'system@partymatch.internal'

let cachedSystemUserId = null

// 平台系統帳號：作為系統聊天室訊息的發送者，沒有密碼、無法登入
export async function getSystemUserId() {
  if (cachedSystemUserId) return cachedSystemUserId

  const user = await prisma.user.upsert({
    where:  { email: SYSTEM_USER_EMAIL },
    update: {},
    create: {
      email:         SYSTEM_USER_EMAIL,
      name:          'PartyMatch 系統訊息',
      phone:         '0000000000',
      avatarInitial: 'P',
      avatarColor:   'linear-gradient(135deg,#667eea,#764ba2)',
      isAdmin:       true,
    },
    select: { id: true },
  })
  cachedSystemUserId = user.id
  return cachedSystemUserId
}

// 每位使用者都有且僅有一間系統聊天室（type: 'system'，participants 只有該使用者自己）
export async function getOrCreateSystemConversation(userId) {
  const existing = await prisma.conversation.findFirst({
    where: { type: 'system', participants: { array_contains: userId } },
  })
  if (existing) return existing

  return prisma.conversation.create({
    data: { type: 'system', participants: [userId] },
  })
}

// 在系統聊天室發送一則訊息（senderId 為系統帳號），並更新 lastMessage / 未讀數
export async function deliverSystemMessage(conversation, content) {
  const senderId = await getSystemUserId()
  return appendMessage(conversation, { senderId, content })
}

// 管理端發送系統訊息給指定使用者：取得（或建立）該使用者的系統聊天室並送出訊息
export async function sendSystemMessageToUser(userId, content) {
  const conversation = await getOrCreateSystemConversation(userId)
  return deliverSystemMessage(conversation, content)
}

const WELCOME_MESSAGE = '歡迎加入 PartyMatch！這裡是系統通知聊天室，平台公告與客服回覆都會顯示在這裡。'

// 新帳號註冊時呼叫：建立系統聊天室並附上一則歡迎訊息（使用者剛建立，聊天室不可能已存在，直接 create 省去多餘查詢）
export async function setupSystemConversationForNewUser(userId) {
  const conversation = await prisma.conversation.create({
    data: { type: 'system', participants: [userId] },
  })
  await deliverSystemMessage(conversation, WELCOME_MESSAGE)
}
