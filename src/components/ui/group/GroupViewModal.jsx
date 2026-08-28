import { useEffect } from 'react'
import { useGroupStore } from '../../../common/stores/useGroupStore'
import { useMemberStore } from '../../../common/stores/useMemberStore'
import { useApplicationStore } from '../../../common/stores/useApplicationStore'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import HostGroupView from '../../../features/manage-groups/components/HostGroupView'
import MemberGroupView from '../../../features/subscriptions/components/MemberGroupView'

export default function GroupViewModal({
  isOpen, onClose, groupId,
  onReportServiceInfoIssue, onResolveDispute, onEscalateDispute, onActivate, onLockGroup, onCancelGroup, onRemoveMember,
  onLeaveGroup, onApprove, onReject, onAdjustBillingDate, errors,
  autoOpenLockGroup, autoOpenActivate, onAutoOpenActivateDone, autoOpenApplications, autoOpenBilling, autoOpenMemberInfo,
  onOpenRenewal, autoOpenCredentials,
}) {
  const groups       = useGroupStore(s => s.groups);
  const allMembers   = useMemberStore(s => s.members)
  const applicationsState = useApplicationStore(s => s.applications)
  const currentUser  = useAuthStore(s => s.user)

  useEffect(() => {
    if (!isOpen || !groupId) return
    useGroupStore.getState().refreshGroup(groupId).catch(console.error)
  }, [isOpen, groupId]);

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
      onReportServiceInfoIssue={onReportServiceInfoIssue}
      onResolveDispute={onResolveDispute}
      onEscalateDispute={onEscalateDispute}
      onRemoveMember={onRemoveMember}
      onActivate={onActivate} onLockGroup={onLockGroup} onCancelGroup={onCancelGroup}
      onApprove={onApprove} onReject={onReject} onAdjustBillingDate={onAdjustBillingDate}
      errors={errors} onClose={onClose}
      autoOpenLockGroup={autoOpenLockGroup}
      autoOpenActivate={autoOpenActivate}
      onAutoOpenActivateDone={onAutoOpenActivateDone}
      autoOpenApplications={autoOpenApplications}
      autoOpenBilling={autoOpenBilling}
      autoOpenMemberInfo={autoOpenMemberInfo}
      onOpenRenewal={onOpenRenewal}
    />
  )
  return <MemberGroupView group={group} onLeaveGroup={onLeaveGroup} onClose={onClose} autoOpenCredentials={autoOpenCredentials} />
}
