import client, { tokenManager } from './axiosClient'
import { normalizeConversation, normalizeMessage } from '../utils/modelNormalizers'
import { startPolling } from '../utils/poller'

export const MESSAGES_PAGE_SIZE = 50
const POLL_INTERVAL_MS = 5000

export async function fetchConversations() {
  return client.get('/conversations')
}

export async function getOrCreateDmConversation(targetUserId) {
  return client.post('/conversations/dm', { targetUserId })
}

export async function fetchMessages(conversationId, { cursor, limit = MESSAGES_PAGE_SIZE } = {}) {
  const messages = await client.get(`/conversations/${conversationId}/messages`, {
    params: { ...(cursor && { cursor }), limit },
  })
  return messages.map(normalizeMessage)
}

export async function fetchOlderMessages(conversationId, oldestCreatedAt, pageSize = MESSAGES_PAGE_SIZE) {
  const messages = await fetchMessages(conversationId, { cursor: oldestCreatedAt, limit: pageSize })
  return {
    messages,
    hasMore: messages.length === pageSize,
  }
}

export async function sendMessage(conversationId, _senderId, { text, type = 'text', attachmentUrl }) {
  return client.post(`/conversations/${conversationId}/messages`, { content: text, type, ...(attachmentUrl && { attachmentUrl }) })
}

export async function sendSystemMessage(conversationId, text) {
  return client.post(`/conversations/${conversationId}/messages`, { content: text, type: 'system' })
}

export async function sendActionMessage(conversationId, { text, actionType, payload = {}, visibleTo = null }) {
  return client.post(`/conversations/${conversationId}/messages`, {
    content:    text,
    type:       'action',
    actionType,
    payload,
    ...(visibleTo ? { visibleTo } : {}),
  })
}

export async function markConversationRead(conversationId) {
  return client.patch(`/conversations/${conversationId}/read`)
}

export async function createGroupConversation({ groupId }) {
  return client.post('/conversations/group', { groupId })
}

export async function leaveConversation(conversationId) {
  return client.patch(`/conversations/${conversationId}/participants`, { action: 'leave' })
}

export async function removeParticipantFromConversation(conversationId, userId) {
  return client.patch(`/conversations/${conversationId}/participants`, { action: 'remove', userId })
}

export function subscribeToConversations(_userId, onUpdate) {
  return startPolling(async (isActive) => {
    if (!tokenManager.get()) return
    try {
      const convs = await fetchConversations()
      if (isActive()) onUpdate(convs.map(normalizeConversation))
    } catch {}
  }, POLL_INTERVAL_MS);
}

export function subscribeToMessages(conversationId, onUpdate, onError) {
  let lastCount = 0

  return startPolling(async (isActive) => {
    if (!tokenManager.get()) return
    try {
      const messages = await fetchMessages(conversationId)
      if (isActive() && messages.length !== lastCount) {
        lastCount = messages.length
        onUpdate(messages)
      }
    } catch (err) {
      console.error('[messagesApi] poll error:', err)
      onError?.()
    }
  }, POLL_INTERVAL_MS)
}
