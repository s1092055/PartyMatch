import { useGroupStore } from '../../../common/stores/useGroupStore'
import { useMemberStore } from '../../../common/stores/useMemberStore'
import { useSubscriptionStore } from '../../../common/stores/useSubscriptionStore'
import { useApplicationStore } from '../../../common/stores/useApplicationStore'
import { useConversationStore } from '../../../common/stores/useConversationStore'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { leaveConversation, sendSystemMessage } from '../../../common/api/messagesApi'
import { insertNotification } from '../../../common/api/notificationsApi'

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
  if (member) {
    // 代管退款金額是後端算的，下面對 group 的樂觀更新不包含 escrowTokens，
    // 真的刪除成功後重新拉一次群組校正回後端算出的值（跟團主端移除成員同一套修正方式）
    useMemberStore.getState().remove(member.id)
      .then(() => useGroupStore.getState().refreshGroup(groupId))
      .catch(console.error)
  }
  // 退出會退還加入時代管的金額，重新拉一次餘額讓畫面上的PM幣顯示同步
  if (member) useAuthStore.getState().refreshTokenBalance().catch(console.error)

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
    // 通知團主（非目前操作者本人，只寫 DB，團主刷新後才看到，避免污染目前使用者的本地通知清單）
    insertNotification({
      userId:  group.hostId,
      type:    'member_left',
      title:   '成員退出群組',
      message: `${user.name} 已退出「${group.groupName ?? group.serviceName}」群組。`,
      meta:    { groupId },
    }).catch(console.error)
  }
}
