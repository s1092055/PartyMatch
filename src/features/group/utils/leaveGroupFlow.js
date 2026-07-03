import { useGroupStore } from '../../../shared/stores/useGroupStore'
import { useMemberStore } from '../../../shared/stores/useMemberStore'
import { useSubscriptionStore } from '../../../shared/stores/useSubscriptionStore'
import { useNotificationStore } from '../../../shared/stores/useNotificationStore'
import { useApplicationStore } from '../../../shared/stores/useApplicationStore'
import { useConversationStore } from '../../../shared/stores/useConversationStore'
import { leaveConversation, sendSystemMessage } from '../../../shared/api/messagesApi'

export async function finalizeLeaveGroup(groupId, user) {
  const convId = useConversationStore.getState().getByGroupId(groupId)?.id ?? null

  if (convId) {
    try {
      await sendSystemMessage(convId, `${user.name} 已退出群組`)
      await leaveConversation(convId)
    } catch (e) { console.error('[leaveGroupFlow] leaveConversation failed:', e) }
  }

  const group = groupId ? useGroupStore.getState().getById(groupId) : null
  const member = groupId ? useMemberStore.getState().getByUserAndGroup(user.id, groupId) : null
  if (member) useMemberStore.getState().remove(member.id)

  // 樂觀把 application 標為 left，讓成員可重新申請
  const appToRemove = useApplicationStore.getState().applications.find(
    a => a.groupId === groupId && (a.applicantId ?? a.userId) === user.id && a.status === 'approved'
  )
  if (appToRemove) {
    useApplicationStore.setState(s => ({
      applications: s.applications.map(a => a.id === appToRemove.id ? { ...a, status: 'left' } : a),
    }))
  }

  const sub = groupId ? useSubscriptionStore.getState().getByUserId(user.id).find(s => s.groupId === groupId) : null
  if (sub) useSubscriptionStore.getState().remove(sub.id)

  if (group) {
    // 直接更新本地狀態，避免打 PATCH /groups（成員沒有權限）
    useGroupStore.setState(s => ({
      groups: s.groups.map(g => g.id === groupId ? {
        ...g,
        usedSeats: Math.max(0, (g.usedSeats ?? 1) - 1),
        openSeats: (g.openSeats ?? 0) + 1,
        status: g.status === 'full' ? 'recruiting' : g.status,
      } : g),
    }))
    useNotificationStore.getState().create({
      userId:  group.hostId,
      type:    'member_left',
      title:   '成員退出群組',
      message: `${user.name} 已退出「${group.groupName ?? group.serviceName}」群組。`,
    })
  }
}
