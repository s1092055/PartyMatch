import { useEffect, useState } from 'react'
import { useGroupStore } from '../../../common/stores/useGroupStore'
import { useMemberStore } from '../../../common/stores/useMemberStore'
import { useApplicationStore } from '../../../common/stores/useApplicationStore'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { startPolling } from '../../../common/utils/poller'
import HostGroupView from '../../../features/manage-groups/components/HostGroupView'
import MemberGroupView from '../../../features/subscriptions/components/MemberGroupView'

const GROUP_POLL_INTERVAL_MS = 15000

export default function GroupViewModal({
  isOpen, onClose, groupId,
  onReportServiceInfoIssue, onResolveDispute, onEscalateDispute, onActivate, onLockGroup, onCancelGroup, onRemoveMember,
  onLeaveGroup, onApprove, onReject, onAdjustBillingDate, errors, submittingIds,
  autoOpenLockGroup, autoOpenActivate, onAutoOpenActivateDone, autoOpenApplications, autoOpenBilling, autoOpenMemberInfo, autoOpenMembers,
  onOpenRenewal, autoOpenCredentials,
}) {
  const groups       = useGroupStore(s => s.groups);
  const allMembers   = useMemberStore(s => s.members)
  const applicationsState = useApplicationStore(s => s.applications)
  const currentUser  = useAuthStore(s => s.user)

  const [refreshedGroupId, setRefreshedGroupId] = useState(null)
  const dataRefreshing = isOpen && !!groupId && refreshedGroupId !== groupId
  useEffect(() => {
    if (!isOpen || !groupId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRefreshedGroupId(null)
      return
    }
    if (!dataRefreshing) return
    let active = true
    const startedAt = Date.now()
    Promise.all([
      useGroupStore.getState().refreshGroup(groupId).catch(console.error),
      useMemberStore.getState().init().catch(console.error),
      useApplicationStore.getState().init().catch(console.error),
    ]).then(() => new Promise(resolve => setTimeout(resolve, Math.max(0, 1500 - (Date.now() - startedAt)))))
      .then(() => { if (active) setRefreshedGroupId(groupId) })
    return () => { active = false }
  }, [dataRefreshing, isOpen, groupId])

  useEffect(() => {
    // 開啟時先重抓一次，之後定期輪詢當作保底機制：群組狀態改變（例如額滿）不是每一種情境都會
    // 通知目前正在看這個群組的人，Modal 開著的期間定期重抓，避免只靠通知機制漏接時畫面一直停在舊狀態
    if (!isOpen || !groupId) return
    const stop = startPolling(async () => {
      await Promise.all([
        useGroupStore.getState().refreshGroup(groupId).catch(console.error),
        useMemberStore.getState().init().catch(console.error),
        useApplicationStore.getState().init().catch(console.error),
      ])
    }, GROUP_POLL_INTERVAL_MS)
    return stop
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
      loading={dataRefreshing}
      group={group} members={members} applications={applications}
      onReportServiceInfoIssue={onReportServiceInfoIssue}
      onResolveDispute={onResolveDispute}
      onEscalateDispute={onEscalateDispute}
      onRemoveMember={onRemoveMember}
      onActivate={onActivate} onLockGroup={onLockGroup} onCancelGroup={onCancelGroup}
      onApprove={onApprove} onReject={onReject} onAdjustBillingDate={onAdjustBillingDate}
      errors={errors} submittingIds={submittingIds} onClose={onClose}
      autoOpenLockGroup={autoOpenLockGroup}
      autoOpenActivate={autoOpenActivate}
      onAutoOpenActivateDone={onAutoOpenActivateDone}
      autoOpenApplications={autoOpenApplications}
      autoOpenBilling={autoOpenBilling}
      autoOpenMemberInfo={autoOpenMemberInfo}
      autoOpenMembers={autoOpenMembers}
      onOpenRenewal={onOpenRenewal}
    />
  )
  return <MemberGroupView loading={dataRefreshing} group={group} onLeaveGroup={onLeaveGroup} onClose={onClose} autoOpenCredentials={autoOpenCredentials} />
}
