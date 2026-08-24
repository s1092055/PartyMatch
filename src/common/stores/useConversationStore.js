import { create } from 'zustand'
import { subscribeToConversations } from '../api/messagesApi'

let _unsub = null

function subscribeAndSync(set, get, userId) {
  if (_unsub) { _unsub(); _unsub = null }
  _unsub = subscribeToConversations(userId, convs => {
    const fetchedIds = new Set(convs.map(c => c.id));
    const stillPendingDms = get().conversations.filter(
      c => c.type === 'dm' && !c.lastMessage && !fetchedIds.has(c.id)
    )
    set({ conversations: [...convs, ...stillPendingDms] })
  })
}

export const useConversationStore = create((set, get) => ({
  conversations: [],

  init: (userId) => {
    if (!userId) return
    get().teardown()
    subscribeAndSync(set, get, userId)
  },

  teardown: () => {
    if (_unsub) { _unsub(); _unsub = null }
    set({ conversations: [] })
  },

  refresh: (userId) => {
    if (!userId) return
    subscribeAndSync(set, get, userId)
  },

  getById: (id)      => get().conversations.find(c => c.id === id) ?? null,
  getByGroupId:   (groupId) => get().conversations.find(c => c.type === 'group' && c.groupId === groupId) ?? null,

  getUnreadMsgCount: (userId) => {
    if (!userId) return 0
    return get().conversations.reduce((sum, c) => sum + (c.unreadCounts?.[userId] ?? 0), 0)
  },

  addConversationOptimistic: (conv) => {
    if (get().conversations.some(c => c.id === conv.id)) return
    set(s => ({ conversations: [conv, ...s.conversations] }))
  },
}))
