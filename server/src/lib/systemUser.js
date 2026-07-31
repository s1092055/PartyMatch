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

// 確保使用者的系統聊天室存在，不存在就建立並附上歡迎訊息——新註冊使用者一定會走到「建立」這條路；
// 既有使用者的聊天室若因故被清空（例如測試環境用 clear-data 腳本清過 Conversation/Message，但保留了 User），
// 下次登入呼叫這裡也會自動補回來，不需要重新註冊帳號。
// 註冊當下呼叫這個函式是 fire-and-forget（不阻塞註冊回應），若那次呼叫途中失敗，會留下
// 一筆「聊天室已建立、但從未成功附上歡迎訊息」的空殼紀錄——如果只檢查「聊天室存不存在」
// 就直接回傳，之後每次登入都會一直找到這筆空殼、誤判成「已經處理過」而永遠不會補發歡迎訊息，
// 所以這裡額外檢查 lastMessage，找到空殼時要主動補發，而不是略過
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
