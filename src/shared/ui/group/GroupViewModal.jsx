import { useEffect } from 'react'
import { useGroupStore } from '../../stores/useGroupStore'
import { useMemberStore } from '../../stores/useMemberStore'
import { useApplicationStore } from '../../stores/useApplicationStore'
import { useAuthStore } from '../../stores/useAuthStore'
import HostGroupView from '../../../features/my-groups/host/components/HostGroupView'
import MemberGroupView from '../../../features/my-groups/member/components/MemberGroupView'

export default function GroupViewModal({
  isOpen, onClose, groupId,
  onReportServiceInfoIssue, onActivate, onLockGroup, onCancelGroup, onRemoveMember,
  onLeaveGroup, onApprove, onReject, errors,
  autoOpenLockGroup, autoOpenActivate, onAutoOpenActivateDone, autoOpenApplications, autoOpenBilling,
  onOpenRenewal,
}) {
  // 訂閱 store 切片，群組/成員/申請更新時自動重新渲染
  const groups       = useGroupStore(s => s.groups)
  const allMembers   = useMemberStore(s => s.members)
  const applicationsState = useApplicationStore(s => s.applications)
  const currentUser  = useAuthStore(s => s.user)

  // 確認期（confirming）可能已經逾期但還沒有人觸發過後端的惰性自動撥款檢查，
  // 開啟詳情時補打一次，讓「逾期自動撥款」這個安全網真的有機會被觸發
  useEffect(() => {
    if (!isOpen || !groupId) return
    if (useGroupStore.getState().getById(groupId)?.status !== 'confirming') return
    useGroupStore.getState().refreshGroup(groupId).catch(console.error)
  }, [isOpen, groupId])

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
      onRemoveMember={onRemoveMember}
      onActivate={onActivate} onLockGroup={onLockGroup} onCancelGroup={onCancelGroup}
      onApprove={onApprove} onReject={onReject}
      errors={errors} onClose={onClose}
      autoOpenLockGroup={autoOpenLockGroup}
      autoOpenActivate={autoOpenActivate}
      onAutoOpenActivateDone={onAutoOpenActivateDone}
      autoOpenApplications={autoOpenApplications}
      autoOpenBilling={autoOpenBilling}
      onOpenRenewal={onOpenRenewal}
    />
  )
  return <MemberGroupView group={group} onLeaveGroup={onLeaveGroup} onClose={onClose} />
}
