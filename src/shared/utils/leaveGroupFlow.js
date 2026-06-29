import { useGroupStore } from '../stores/useGroupStore'
import { useMemberStore } from '../stores/useMemberStore'
import { useSubscriptionStore } from '../stores/useSubscriptionStore'
import { useNotificationStore } from '../stores/useNotificationStore'
import { leaveConversation, sendSystemMessage } from '../api/messagesApi'

export async function finalizeLeaveGroup(conversationId, groupId, user) {
  try {
    await sendSystemMessage(conversationId, `${user.name} 已退出群組`)
    await leaveConversation(conversationId, user.id)
  } catch (e) { console.error('[leaveGroupFlow] leaveConversation failed:', e) }

  const group = groupId ? useGroupStore.getState().getById(groupId) : null
  const member = groupId ? useMemberStore.getState().getByUserAndGroup(user.id, groupId) : null
  if (member) useMemberStore.getState().remove(member.id)
  const sub = groupId ? useSubscriptionStore.getState().getByUserId(user.id).find(s => s.groupId === groupId) : null
  if (sub) useSubscriptionStore.getState().remove(sub.id)
  if (group) {
    useGroupStore.getState().update(group.id, {
      usedSeats: Math.max(0, (group.usedSeats ?? 1) - 1),
      openSeats: (group.openSeats ?? 0) + 1,
      status: group.status === 'full' ? 'recruiting' : group.status,
    })
    useNotificationStore.getState().create({
      userId:  group.hostId,
      type:    'member_left',
      title:   '成員退出群組',
      message: `${user.name} 已退出「${group.groupName ?? group.serviceName}」群組。`,
    })
  }
}
