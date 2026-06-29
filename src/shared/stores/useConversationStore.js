import { create } from 'zustand'
import { subscribeToConversations } from '../api/messagesApi'
import { useAuthStore } from './useAuthStore'
import { useNotificationStore } from './useNotificationStore'

let _unsub = null
let _prevConvIds = null

function maybeNotifyGroupChats(convs, currentUser) {
  if (!currentUser) return
  const notifStore = useNotificationStore.getState()
  const existingGroupChatIds = new Set(
    notifStore.getByUserId(currentUser.id)
      .filter(n => n.type === 'group_chat_opened')
      .map(n => n.meta?.groupId)
      .filter(Boolean)
  )
  convs.forEach(conv => {
    if (conv.type === 'group' && conv.groupId && conv.hostId && conv.hostId !== currentUser.id) {
      const isNew = _prevConvIds === null
        ? !existingGroupChatIds.has(conv.groupId)
        : !_prevConvIds.has(conv.id)
      if (isNew) {
        notifStore.create({
          userId:  currentUser.id,
          type:    'group_chat_opened',
          title:   '群組聊天室已開啟',
          message: `「${conv.name ?? conv.groupName}」群組聊天室已建立，點擊前往查看。`,
          meta:    { groupId: conv.groupId },
        })
      }
    }
  })
}

export const useConversationStore = create((set, get) => ({
  conversations: [],

  // ── 初始化（建立 Firestore 監聽 + 冷啟動補通知）─────────────────────────────
  init: (userId) => {
    if (!userId) return
    get().teardown()
    _prevConvIds = null
    _unsub = subscribeToConversations(userId, convs => {
      const currentUser = useAuthStore.getState().getProfile()
      maybeNotifyGroupChats(convs, currentUser)
      _prevConvIds = new Set(convs.map(c => c.id))
      set({ conversations: convs })
    })
  },

  teardown: () => {
    if (_unsub) { _unsub(); _unsub = null }
    _prevConvIds = null
    set({ conversations: [] })
  },

  // 重新建立監聽，不清空現有資料（避免閃爍）
  refresh: (userId) => {
    if (!userId) return
    if (_unsub) { _unsub(); _unsub = null }
    _unsub = subscribeToConversations(userId, convs => {
      set({ conversations: convs })
    })
  },

  // ── 選取器 ──────────────────────────────────────────────────────────────────
  getById: (id) => get().conversations.find(c => c.id === id) ?? null,

  getUnreadMsgCount: (userId) => {
    if (!userId) return 0
    return get().conversations.reduce((sum, c) => sum + (c.unreadCounts?.[userId] ?? 0), 0)
  },

  // ── 樂觀新增對話 ────────────────────────────────────────────────────────────
  addConversationOptimistic: (conv) => {
    if (get().conversations.some(c => c.id === conv.id)) return
    set(s => ({ conversations: [conv, ...s.conversations] }))
  },
}))
