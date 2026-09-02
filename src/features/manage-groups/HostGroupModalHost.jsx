import { useEffect } from 'react'
import { useAuthStore } from '../../common/stores/useAuthStore'
import { useOpenGroupStore } from '../../common/stores/useOpenGroupStore'
import GroupViewModal from '../../components/ui/group/GroupViewModal'
import RenewalModal from './components/RenewalModal'
import { useHostActions } from './hooks/useHostActions'

// 團主的群組 Modal 全站掛載在這裡（跟成員端的 GroupDetailModal 同一個道理），
// 讓 pm:open-host-group 事件不管在哪個頁面都能直接開啟，不用像過去那樣
// 一定要先導頁到 /manage-groups、頁面重新掛載後才能接到事件
export default function HostGroupModalHost() {
  const activeUser = useAuthStore(s => s.user)

  const {
    errors,
    submittingIds,
    viewGroupId, setViewGroupId,
    autoOpenLockGroup, setAutoOpenLockGroup,
    autoOpenActivate, setAutoOpenActivate,
    autoOpenApplications, setAutoOpenApplications,
    autoOpenBilling, setAutoOpenBilling,
    autoOpenMemberInfo, setAutoOpenMemberInfo,
    autoOpenMembers, setAutoOpenMembers,
    setRenewalModalGroupId,
    membersMap,
    renewalModalGroup,
    refreshGroups,
    handleLockGroup,
    handleRemoveMember,
    handleActivate,
    handleCancelGroup,
    handleStartRenewal,
    handleEndGroup,
    handleApprove,
    handleReportServiceInfoIssue,
    handleResolveDispute,
    handleEscalateDispute,
    handleReject,
    handleAdjustBillingDate,
  } = useHostActions(activeUser)

  // 讓背景 polling（App.jsx）知道使用者現在是不是已經開著這個群組的 Modal，
  // 已經在看的話某些通知就不用再跳 toast 提醒了
  useEffect(() => {
    useOpenGroupStore.getState().setHostOpenGroupId(viewGroupId)
  }, [viewGroupId])

  if (!activeUser) return null

  return (
    <>
      <GroupViewModal
        isOpen={!!viewGroupId}
        onClose={() => { setViewGroupId(null); setAutoOpenLockGroup(false); setAutoOpenActivate(false); setAutoOpenApplications(false); setAutoOpenBilling(false); setAutoOpenMemberInfo(false); setAutoOpenMembers(false); refreshGroups() }}
        groupId={viewGroupId}
        onReportServiceInfoIssue={handleReportServiceInfoIssue}
        onResolveDispute={handleResolveDispute}
        onEscalateDispute={handleEscalateDispute}
        onActivate={handleActivate}
        onLockGroup={handleLockGroup}
        onCancelGroup={handleCancelGroup}
        onRemoveMember={handleRemoveMember}
        onApprove={handleApprove}
        onReject={handleReject}
        onAdjustBillingDate={handleAdjustBillingDate}
        errors={errors}
        submittingIds={submittingIds}
        autoOpenLockGroup={autoOpenLockGroup}
        autoOpenActivate={autoOpenActivate}
        onAutoOpenActivateDone={() => setAutoOpenActivate(false)}
        autoOpenApplications={autoOpenApplications}
        autoOpenBilling={autoOpenBilling}
        autoOpenMemberInfo={autoOpenMemberInfo}
        autoOpenMembers={autoOpenMembers}
        onOpenRenewal={() => setRenewalModalGroupId(viewGroupId)}
      />
      {renewalModalGroup && (
        <RenewalModal
          isOpen
          onClose={() => setRenewalModalGroupId(null)}
          group={renewalModalGroup}
          members={membersMap[renewalModalGroup.id] ?? []}
          onStartRenewal={handleStartRenewal}
          onEndGroup={handleEndGroup}
        />
      )}
    </>
  )
}
