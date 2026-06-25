// 退出群組的共用流程：先排程，使用者可在復原緩衝期內透過 toast 的「復原」按鈕取消，
// 過期才真正寫入系統訊息／退出聊天室／釋出名額／移除成員記錄／通知團主。
import { getGroupById, updateGroup } from '../stores/groupStore'
import { getMemberByUserAndGroup, removeMember } from '../stores/memberStore'
import { getSubscriptionsByUserId, removeSubscription } from '../stores/subscriptionStore'
import { createNotification } from '../stores/notificationStore'
import { leaveConversation, sendSystemMessage } from '../api/messagesApi'
import { toast } from './toast'

export const LEAVE_GROUP_GRACE_MS = 8000

const pendingLeaveTimers = new Map()

async function finalizeLeaveGroup(conversationId, groupId, user) {
  try {
    await sendSystemMessage(conversationId, `${user.name} 已退出群組`)
    await leaveConversation(conversationId, user.id)
  } catch (e) { console.error('[leaveGroupFlow] leaveConversation failed:', e) }

  const group = groupId ? getGroupById(groupId) : null
  const member = groupId ? getMemberByUserAndGroup(user.id, groupId) : null
  if (member) removeMember(member.id)
  const sub = groupId ? getSubscriptionsByUserId(user.id).find(s => s.groupId === groupId) : null
  if (sub) removeSubscription(sub.id)
  if (group) {
    updateGroup(group.id, {
      usedSeats: Math.max(0, (group.usedSeats ?? 1) - 1),
      openSeats: (group.openSeats ?? 0) + 1,
      status: group.status === 'full' ? 'recruiting' : group.status,
    })
    createNotification({
      userId:  group.hostId,
      type:    'member_left',
      title:   '成員退出群組',
      message: `${user.name} 已退出「${group.groupName ?? group.serviceName}」群組。`,
    })
  }
}

// 啟動退出群組的復原緩衝期。onScheduled 在排程當下立即觸發（例如關閉 modal）；
// onUndo 在使用者按下「復原」成功取消時觸發。
export function scheduleLeaveGroup({ conversationId, groupId, user, groupName, onScheduled, onUndo }) {
  const timerId = setTimeout(() => {
    pendingLeaveTimers.delete(conversationId)
    finalizeLeaveGroup(conversationId, groupId, user)
  }, LEAVE_GROUP_GRACE_MS)
  pendingLeaveTimers.set(conversationId, timerId)
  onScheduled?.()

  toast(`已退出「${groupName}」`, 'info', {
    duration: LEAVE_GROUP_GRACE_MS,
    action: {
      label: '復原',
      onClick: () => {
        const pending = pendingLeaveTimers.get(conversationId)
        if (pending) {
          clearTimeout(pending)
          pendingLeaveTimers.delete(conversationId)
          onUndo?.()
        }
      },
    },
  })
}
