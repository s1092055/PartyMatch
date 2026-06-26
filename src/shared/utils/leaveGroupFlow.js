import { getGroupById, updateGroup } from '../stores/groupStore'
import { getMemberByUserAndGroup, removeMember } from '../stores/memberStore'
import { getSubscriptionsByUserId, removeSubscription } from '../stores/subscriptionStore'
import { createNotification } from '../stores/notificationStore'
import { leaveConversation, sendSystemMessage } from '../api/messagesApi'

export async function finalizeLeaveGroup(conversationId, groupId, user) {
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
