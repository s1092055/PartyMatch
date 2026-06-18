import { subscribeToConversations } from '../api/messagesApi'
import { getActiveUserProfile } from './authStore'
import { createNotification } from './notificationStore'

let _conversations = []
let _unsub = null

export function initConversations(userId) {
  teardownConversations()
  let _prevConvIds = null  // null = 首次 snapshot，建立基線不發通知
  _unsub = subscribeToConversations(userId, convs => {
    if (_prevConvIds !== null) {
      const currentUser = getActiveUserProfile()
      if (currentUser) {
        convs.forEach(conv => {
          // 第一次出現的群組對話，且當前用戶不是團主 → 成員收到聊天室開啟通知
          if (!_prevConvIds.has(conv.id) && conv.type === 'group' && conv.groupId && conv.hostId !== currentUser.id) {
            createNotification({
              userId:  currentUser.id,
              type:    'group_chat_opened',
              title:   '群組聊天室已開啟',
              message: `「${conv.name ?? conv.groupName}」群組聊天室已建立，點擊前往查看。`,
              meta:    { groupId: conv.groupId },
            })
          }
        })
      }
    }
    _prevConvIds = new Set(convs.map(c => c.id))
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
