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

export function getConversations() { return _conversations }

export function getUnreadMsgCount(userId) {
  if (!userId) return 0
  return _conversations.reduce((sum, c) => sum + (c.unreadCounts?.[userId] ?? 0), 0)
}
