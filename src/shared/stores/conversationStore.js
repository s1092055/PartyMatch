import { subscribeToConversations } from '../api/messagesApi'

let _conversations = []
let _unsub = null

export function initConversations(userId) {
  teardownConversations()
  _unsub = subscribeToConversations(userId, convs => {
    _conversations = convs
    window.dispatchEvent(new CustomEvent('pm:convs-changed'))
  })
}

export function teardownConversations() {
  if (_unsub) { _unsub(); _unsub = null }
  _conversations = []
  window.dispatchEvent(new CustomEvent('pm:convs-changed'))
}

// 重新建立 Firestore 監聽，不清空現有資料（避免畫面閃爍），用於 MessagesModal 開啟時確保資料最新
export function refreshConversations(userId) {
  if (_unsub) { _unsub(); _unsub = null }
  _unsub = subscribeToConversations(userId, convs => {
    _conversations = convs
    window.dispatchEvent(new CustomEvent('pm:convs-changed'))
  })
}

export function getConversations() { return _conversations }

export function addConversationOptimistic(conv) {
  if (_conversations.some(c => c.id === conv.id)) return
  _conversations = [conv, ..._conversations]
  window.dispatchEvent(new CustomEvent('pm:convs-changed'))
}

export function getUnreadMsgCount(userId) {
  if (!userId) return 0
  return _conversations.reduce((sum, c) => sum + (c.unreadCounts?.[userId] ?? 0), 0)
}
