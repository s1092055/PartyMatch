import { useGroupStore } from '../../../common/stores/useGroupStore'
import { useMemberStore } from '../../../common/stores/useMemberStore'
import { useSubscriptionStore } from '../../../common/stores/useSubscriptionStore'
import { useApplicationStore } from '../../../common/stores/useApplicationStore'
import { useConversationStore } from '../../../common/stores/useConversationStore'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { leaveConversation, sendSystemMessage } from '../../../common/api/messagesApi'

export async function finalizeLeaveGroup(groupId, user) {
  const convId = useConversationStore.getState().getByGroupId(groupId)?.id ?? null

  if (convId) {
    try {
      await sendSystemMessage(convId, `${user.name} 已退出群組`)
      await leaveConversation(convId)
    } catch (e) { console.error('[leaveGroupFlow] leaveConversation failed:', e) }
  }

  const member = groupId ? useMemberStore.getState().getByUserAndGroup(user.id, groupId) : null
  if (member) {
    useMemberStore.getState().remove(member.id)
      .then(() => Promise.all([
        useGroupStore.getState().refreshGroup(groupId),
        useAuthStore.getState().refreshTokenBalance(),
      ]))
      .catch(console.error);
  }

  const appToRemove = useApplicationStore.getState().applications.find(
    a => a.groupId === groupId && (a.applicantId ?? a.userId) === user.id && a.status === 'approved'
  );
  if (appToRemove) {
    useApplicationStore.setState(s => ({
      applications: s.applications.map(a => a.id === appToRemove.id ? { ...a, status: 'left' } : a),
    }))
  }

  const sub = groupId ? useSubscriptionStore.getState().getByUserId(user.id).find(s => s.groupId === groupId) : null
  if (sub) useSubscriptionStore.getState().remove(sub.id)
}
