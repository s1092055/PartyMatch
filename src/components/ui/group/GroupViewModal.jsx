import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { useGroupStore } from '../../../common/stores/useGroupStore'
import { useMemberStore } from '../../../common/stores/useMemberStore'
import { useApplicationStore } from '../../../common/stores/useApplicationStore'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { useNotificationStore } from '../../../common/stores/useNotificationStore'
import HostGroupView from '../../../features/manage-groups/components/HostGroupView'
import MemberGroupView from '../../../features/subscriptions/components/MemberGroupView'
import {
  AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogAction,
} from '../alert-dialog'

const BILLING_DATE_NOTIF_TYPES = new Set(['billing_date_confirmed', 'billing_date_adjusted']);

export default function GroupViewModal({
  isOpen, onClose, groupId,
  onReportServiceInfoIssue, onResolveDispute, onActivate, onLockGroup, onCancelGroup, onRemoveMember,
  onLeaveGroup, onApprove, onReject, onAdjustBillingDate, errors,
  autoOpenLockGroup, autoOpenActivate, onAutoOpenActivateDone, autoOpenApplications, autoOpenBilling, autoOpenMemberInfo,
  onOpenRenewal, autoOpenCredentials,
}) {
  const groups       = useGroupStore(s => s.groups);
  const allMembers   = useMemberStore(s => s.members)
  const applicationsState = useApplicationStore(s => s.applications)
  const currentUser  = useAuthStore(s => s.user)
  const notifications = useNotificationStore(s => s.notifications)
  const [billingNoticeDismissed, setBillingNoticeDismissed] = useState(false)

  useEffect(() => {
    if (!isOpen || !groupId) return
    if (!['confirming', 'pending_confirmation'].includes(useGroupStore.getState().getById(groupId)?.status)) return
    useGroupStore.getState().refreshGroup(groupId).catch(console.error)
  }, [isOpen, groupId]);

  const openKey = `${groupId ?? ''}:${isOpen ? 1 : 0}`;
  const [prevOpenKey, setPrevOpenKey] = useState(openKey)
  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey)
    setBillingNoticeDismissed(false)
  }

  const billingNotice = currentUser?.id && groupId
    ? notifications.find(n =>
        n.userId === currentUser.id && !n.isRead && n.meta?.groupId === groupId && BILLING_DATE_NOTIF_TYPES.has(n.type)
      ) ?? null
    : null

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

  if (billingNotice && !billingNoticeDismissed) {
    return (
      <AlertDialog open onOpenChange={v => { if (!v) { useNotificationStore.getState().markRead(billingNotice.id); setBillingNoticeDismissed(true) } }}>
        <AlertDialogContent>
          <AlertDialogTitle className="flex items-center gap-2">
            <CalendarClock strokeWidth={1.5} size={18} className="shrink-0 text-brand" />
            {billingNotice.title}
          </AlertDialogTitle>
          <AlertDialogDescription>{billingNotice.message}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction>我知道了</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (isHost) return (
    <HostGroupView
      group={group} members={members} applications={applications}
      onReportServiceInfoIssue={onReportServiceInfoIssue}
      onResolveDispute={onResolveDispute}
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
