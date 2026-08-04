import prisma from './prisma.js'
import { maskAvatar } from './avatarVisibility.js'

export function isSystemConversation(conversation) {
  return conversation.type === 'system'
}

export function parseParticipants(conversation) {
  return Array.isArray(conversation.participants)
    ? conversation.participants
    : JSON.parse(conversation.participants ?? '[]')
}

// 建立訊息並更新對話的 lastMessage / 未讀數，供一般聊天室與系統聊天室共用
// participants 可由呼叫端傳入已解析好的陣列，避免重複 JSON.parse
export async function appendMessage(conversation, { senderId, content, type = 'text', actionType, payload, participants }) {
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId,
      content,
      type,
      ...(actionType !== undefined && { actionType }),
      ...(payload    !== undefined && { payload }),
    },
    include: { sender: { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true } } },
  })
  message.sender = maskAvatar(message.sender)

  const unreadCounts = { ...(conversation.unreadCounts ?? {}) }
  for (const uid of participants ?? parseParticipants(conversation)) {
    if (uid !== senderId) unreadCounts[uid] = (unreadCounts[uid] ?? 0) + 1
  }

  await prisma.conversation.update({
    where: { id: conversation.id },
    data:  {
      lastMessage: { content, senderId, createdAt: message.createdAt },
      unreadCounts,
      updatedAt: new Date(),
    },
  })

  return message
}
