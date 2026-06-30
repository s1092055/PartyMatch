import client from './axiosClient'
import { normalizeConversation } from '../utils/modelNormalizers'

export const MESSAGES_PAGE_SIZE = 50
const POLL_INTERVAL_MS = 5000

export async function fetchConversations() {
  return client.get('/conversations')
}

export async function getOrCreateDmConversation(targetUserId) {
  return client.post('/conversations/dm', { targetUserId })
}

export async function fetchMessages(conversationId, { cursor, limit = MESSAGES_PAGE_SIZE } = {}) {
  return client.get(`/conversations/${conversationId}/messages`, {
    params: { ...(cursor && { cursor }), limit },
  })
}

export async function fetchOlderMessages(conversationId, oldestCreatedAt, pageSize = MESSAGES_PAGE_SIZE) {
  const messages = await fetchMessages(conversationId, { cursor: oldestCreatedAt, limit: pageSize })
  return {
    messages,
    hasMore: messages.length === pageSize,
  }
}

export async function sendMessage(conversationId, _senderId, { text, type = 'text' }) {
  return client.post(`/conversations/${conversationId}/messages`, { content: text, type })
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

export async function addParticipantToConversation(conversationId, userId) {
  return client.patch(`/conversations/${conversationId}/participants`, { userId, action: 'add' })
}

export async function leaveConversation(conversationId) {
  return client.patch(`/conversations/${conversationId}/participants`, { action: 'leave' })
}

// 輪詢版本取代 Firebase onSnapshot，每 POLL_INTERVAL_MS 毫秒拉一次
export function subscribeToConversations(_userId, onUpdate) {
  let active = true

  async function poll() {
    if (!active) return
    try {
      const convs = await fetchConversations()
      if (active) onUpdate(convs.map(normalizeConversation))
    } catch { /* ignore */ }
  }

  poll()
  const timer = setInterval(poll, POLL_INTERVAL_MS)

  return () => {
    active = false
    clearInterval(timer)
  }
}

export function subscribeToMessages(conversationId, onUpdate, onError) {
  let active = true
  let lastCount = 0

  async function poll() {
    if (!active) return
    try {
      const messages = await fetchMessages(conversationId)
      if (active) {
        if (messages.length !== lastCount) {
          lastCount = messages.length
          onUpdate(messages)
        }
      }
    } catch (err) {
      console.error('[messagesApi] poll error:', err)
      onError?.()
    }
  }

  poll()
  const timer = setInterval(poll, POLL_INTERVAL_MS)

  return () => {
    active = false
    clearInterval(timer)
  }
}
