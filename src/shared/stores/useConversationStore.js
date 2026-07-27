import { create } from 'zustand'
import { subscribeToConversations } from '../api/messagesApi'

let _unsub = null

// init()/refresh() 共用的訂閱回呼
function subscribeAndSync(set, get, userId) {
  if (_unsub) { _unsub(); _unsub = null }
  _unsub = subscribeToConversations(userId, convs => {
    // 後端 GET /conversations 會把還沒有任何訊息的 DM 濾掉（延遲曝光），但使用者剛點「聯絡」
    // 樂觀建立的那筆空 DM 還在畫面上等他打字，不能被這次輪詢結果直接蓋掉，否則聊天視窗會
    // 突然找不到這筆對話；保留本地既有、還沒送出過訊息的 DM，直到它真的有訊息才會被輪詢結果取代
    const fetchedIds = new Set(convs.map(c => c.id))
    const stillPendingDms = get().conversations.filter(
      c => c.type === 'dm' && !c.lastMessage && !fetchedIds.has(c.id)
    )
    set({ conversations: [...convs, ...stillPendingDms] })
  })
}

export const useConversationStore = create((set, get) => ({
  conversations: [],

  // ── 初始化（啟動 polling）───────────────────────────────────────────────────
  init: (userId) => {
    if (!userId) return
    get().teardown()
    subscribeAndSync(set, get, userId)
  },

  teardown: () => {
    if (_unsub) { _unsub(); _unsub = null }
    set({ conversations: [] })
  },

  // 重新建立監聽，不清空現有資料（避免閃爍）
  refresh: (userId) => {
    if (!userId) return
    subscribeAndSync(set, get, userId)
  },

  // ── 選取器 ──────────────────────────────────────────────────────────────────
  getById:        (id)      => get().conversations.find(c => c.id === id) ?? null,
  getByGroupId:   (groupId) => get().conversations.find(c => c.type === 'group' && c.groupId === groupId) ?? null,

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
