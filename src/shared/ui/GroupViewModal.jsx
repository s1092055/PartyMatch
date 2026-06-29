import { useGroupStore } from '../stores/useGroupStore'
import { useMemberStore } from '../stores/useMemberStore'
import { useApplicationStore } from '../stores/useApplicationStore'
import { useAuthStore } from '../stores/useAuthStore'
import HostGroupView from '../../features/manage/components/HostGroupView'
import MemberGroupView from '../../features/subscriptions/components/MemberGroupView'

export default function GroupViewModal({
  isOpen, onClose, groupId,
  onConfirmMember, onReportPaymentIssue, onReportServiceInfoIssue, onActivate, onActivateGroup, onRemoveMember,
  onLeaveGroup, onApprove, onReject, errors,
  autoOpenPayment, autoOpenActivateGroup, autoOpenActivate, onAutoOpenActivateDone, autoOpenApplications, autoOpenBilling,
}) {
  // 訂閱 store 切片，群組/成員/申請更新時自動重新渲染
  const groups       = useGroupStore(s => s.groups)
  const allMembers   = useMemberStore(s => s.members)
  const applicationsState = useApplicationStore(s => s.applications)
  const currentUser  = useAuthStore(s => s.user)

  if (!isOpen || !groupId) return null
  const group = groups.find(g => g.id === groupId) ?? null
  if (!group) return null
  const isHost       = currentUser?.id === group.hostId
  const members      = allMembers.filter(m => m.groupId === groupId)
  const applications = isHost
    ? applicationsState
        .filter(a => a.groupId === groupId)
        .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
    : []

  if (isHost) return (
    <HostGroupView
      group={group} members={members} applications={applications}
      onConfirmMember={onConfirmMember} onReportPaymentIssue={onReportPaymentIssue}
      onReportServiceInfoIssue={onReportServiceInfoIssue}
      onRemoveMember={onRemoveMember}
      onActivate={onActivate} onActivateGroup={onActivateGroup}
      onApprove={onApprove} onReject={onReject}
      errors={errors} onClose={onClose}
      autoOpenActivateGroup={autoOpenActivateGroup}
      autoOpenActivate={autoOpenActivate}
      onAutoOpenActivateDone={onAutoOpenActivateDone}
      autoOpenApplications={autoOpenApplications}
      autoOpenBilling={autoOpenBilling}
    />
  )
  return <MemberGroupView group={group} onLeaveGroup={onLeaveGroup} onClose={onClose} autoOpenPayment={autoOpenPayment} />
}
