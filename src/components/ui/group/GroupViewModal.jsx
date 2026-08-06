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

// 下次扣款日定案（鎖定時的預估、啟用時的正式定案）或被團主調整時都會發這兩種通知；
// 開啟群組詳情當下如果剛好有還沒看過的這類通知，先跳一個輕量提醒，關閉後才顯示
// 正常的群組詳情內容，兩邊（團主／成員）共用同一套邏輯，不用各自在 HostGroupView／
// MemberGroupView 裡重複實作
const BILLING_DATE_NOTIF_TYPES = new Set(['billing_date_confirmed', 'billing_date_adjusted'])

export default function GroupViewModal({
  isOpen, onClose, groupId,
  onReportServiceInfoIssue, onResolveDispute, onActivate, onLockGroup, onCancelGroup, onRemoveMember,
  onLeaveGroup, onApprove, onReject, onAdjustBillingDate, errors,
  autoOpenLockGroup, autoOpenActivate, onAutoOpenActivateDone, autoOpenApplications, autoOpenBilling, autoOpenMemberInfo,
  onOpenRenewal,
}) {
  // 訂閱 store 切片，群組/成員/申請更新時自動重新渲染
  const groups       = useGroupStore(s => s.groups)
  const allMembers   = useMemberStore(s => s.members)
  const applicationsState = useApplicationStore(s => s.applications)
  const currentUser  = useAuthStore(s => s.user)
  const notifications = useNotificationStore(s => s.notifications)
  const [billingNoticeDismissed, setBillingNoticeDismissed] = useState(false)

  // 確認期（confirming）可能已經逾期但還沒有人觸發過後端的惰性自動撥款檢查，
  // 開啟詳情時補打一次，讓「逾期自動撥款」這個安全網真的有機會被觸發
  useEffect(() => {
    if (!isOpen || !groupId) return
    if (useGroupStore.getState().getById(groupId)?.status !== 'confirming') return
    useGroupStore.getState().refreshGroup(groupId).catch(console.error)
  }, [isOpen, groupId])

  // 每次換一個群組，或關閉後重新打開，都要讓提醒有機會再跳一次（只要通知本身還沒讀過）；
  // 於 render 期間比對前一次的 key 並直接呼叫 setState，避免用 useEffect 多一次
  // render-commit-effect 循環（同一套手法見 AppNav.jsx 的 prevPathname）
  const openKey = `${groupId ?? ''}:${isOpen ? 1 : 0}`
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
    // AlertDialogAction 點擊後 Radix 會自動關閉 Dialog、觸發下面的 onOpenChange(false)，
    // 不用在按鈕自己的 onClick 再重複處理一次已讀/dismiss
    return (
      <AlertDialog open onOpenChange={v => { if (!v) { useNotificationStore.getState().markRead(billingNotice.id); setBillingNoticeDismissed(true) } }}>
        <AlertDialogContent>
          <AlertDialogTitle className="flex items-center gap-2">
            <CalendarClock size={18} className="shrink-0 text-brand" />
            {billingNotice.title}
          </AlertDialogTitle>
          <AlertDialogDescription>{billingNotice.message}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction>我知道了</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
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
  return <MemberGroupView group={group} onLeaveGroup={onLeaveGroup} onClose={onClose} />
}
