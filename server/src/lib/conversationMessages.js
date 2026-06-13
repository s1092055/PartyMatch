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

export async function appendMessage(
  conversation,
  { senderId, content, type = 'text', actionType, payload, attachmentUrl, participants }
) {
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId,
      content,
      type,
      ...(actionType     !== undefined && { actionType }),
      ...(payload        !== undefined && { payload }),
      ...(attachmentUrl  !== undefined && { attachmentUrl }),
    },
    include: { sender: { select: { id: true, name: true, avatarColor: true, avatarInitial: true, showAvatar: true, presenceStatus: true } } },
  })
  message.sender = maskAvatar(message.sender)

  const unreadCounts = { ...(conversation.unreadCounts ?? {}) }
  for (const uid of participants ?? parseParticipants(conversation)) {
    if (uid !== senderId) unreadCounts[uid] = (unreadCounts[uid] ?? 0) + 1
  }

  const lastMessageContent = content || (attachmentUrl ? '[圖片]' : '')
  await prisma.conversation.update({
    where: { id: conversation.id },
    data:  {
      lastMessage: { content: lastMessageContent, senderId, createdAt: message.createdAt },
      unreadCounts,
      updatedAt: new Date(),
    },
  })

  return message
}
