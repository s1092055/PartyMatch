import { markConversationRead } from '../../common/api/messagesApi'
import { useConversationStore } from '../../common/stores/useConversationStore'

export function isSystemConversation(conversation) {
  return conversation?.type === 'system'
}

export function markConversationReadLocal(conversationId, userId) {
  if (!conversationId || !userId) return
  const conv = useConversationStore.getState().getById(conversationId)
  if ((conv?.unreadCounts?.[userId] ?? 0) === 0) return
  markConversationRead(conversationId).catch(console.error)
  useConversationStore.setState(s => ({
    conversations: s.conversations.map(c =>
      c.id === conversationId
        ? { ...c, unreadCounts: { ...c.unreadCounts, [userId]: 0 } }
        : c
    ),
  }))
}

export function formatTime(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
}
