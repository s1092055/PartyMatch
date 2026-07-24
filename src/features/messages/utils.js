import { markConversationRead } from '../../shared/api/messagesApi'
import { useConversationStore } from '../../shared/stores/useConversationStore'

export function isSystemConversation(conversation) {
  return conversation?.type === 'system'
}

// 標記對話已讀：打 API 之餘同步把本地 store 的未讀數歸零，避免等下次 polling 才更新
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
