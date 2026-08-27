import { useEffect, useMemo, useState } from 'react'
import { Banknote, ChevronLeft, CheckCircle2, ClipboardList, Clock, Info, KeyRound, LockKeyhole, MessageCircle, PlayCircle, Trash2, Users } from 'lucide-react'
import { Avatar } from '../../../components/ui/avatar'
import { PresenceDot } from '../../../common/layout/components/navShared'
import { Button } from '../../../components/ui/button'
import ConfirmActionDialog from '../../../components/ui/ConfirmActionDialog'
import CountdownText from '../../../components/ui/primitives/CountdownText'
import GroupModalShell from '../../../components/ui/group/GroupModalShell'
import GroupModalSideBarItem from '../../../components/ui/group/GroupModalSideBarItem'
import UserReviews from '../../group/components/UserReviews'
import ReviewUserModal from '../../subscriptions/components/ReviewUserModal'
import { getServiceById } from '../../../common/utils/serviceUtils'
import { isSharedCredentialsMethod } from '../../../common/utils/serviceInfoFields'
import { canReportServiceIssue } from '../../../common/utils/groupStatus'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { useApplicationStore } from '../../../common/stores/useApplicationStore'
import { useMemberStore } from '../../../common/stores/useMemberStore'
import { useNotificationStore } from '../../../common/stores/useNotificationStore'
import { useReviewStore } from '../../../common/stores/useReviewStore'
import { fetchGroupTransactions } from '../../../common/api/groupsApi'
import { uploadServiceIssueEvidence } from '../../../common/api/storageApi'
import { useEvidenceUpload } from '../../../common/utils/hooks'
import ActivateServiceModal from './ActivateServiceModal'
import ReportServiceIssueModal from './ReportServiceIssueModal'
import LockGroupCredentialsModal from './LockGroupCredentialsModal'
import AdjustBillingDateModal from './AdjustBillingDateModal'
import { buildMembersPanel } from './hostGroupView/buildMembersPanel'
import { buildApplicationsPanel } from './hostGroupView/buildApplicationsPanel'
import { buildReviewHistoryPanel } from './hostGroupView/buildReviewHistoryPanel'
import { buildBillingPanel } from './hostGroupView/buildBillingPanel'
import { buildMemberInfoPanel } from './hostGroupView/buildMemberInfoPanel'

export default function HostGroupView(
  { group, members, applications, onReportServiceInfoIssue, onResolveDispute, onRemoveMember, onActivate, onLockGroup, onCancelGroup, onApprove, onReject, onAdjustBillingDate, errors, onClose, autoOpenLockGroup, autoOpenActivate, onAutoOpenActivateDone, autoOpenApplications, autoOpenBilling, autoOpenMemberInfo, onOpenRenewal }
) {
  const [showActivate, setShowActivate]                   = useState(false)
  const [removingMember, setRemovingMember]               = useState(null)
  const [activePanel, setActivePanel]                     = useState(null);
  const [showReviewHistory, setShowReviewHistory]         = useState(false)
  const [showMemberReviews, setShowMemberReviews]         = useState(false)
  const [reviewingMember, setReviewingMember]              = useState(null)
  const [reviewTargetMember, setReviewTargetMember]        = useState(null)
  const [showLockGroupConfirm, setShowLockGroupConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm]         = useState(false)
  const [transactions, setTransactions]                     = useState([])
  const [transactionsLoading, setTransactionsLoading]       = useState(false)
  const [showCredentialsModal, setShowCredentialsModal]     = useState(false)
  const [showPassword, setShowPassword]                     = useState(false)
  const [credentialValues, setCredentialValues]             = useState({})
  const [lockLoading, setLockLoading]                       = useState(false)
  const [showAdjustBillingDate, setShowAdjustBillingDate]   = useState(false)
  const [newBillingDate, setNewBillingDate]                 = useState('')
  const [billingDateNote, setBillingDateNote]               = useState('')
  const [adjustingBillingDate, setAdjustingBillingDate]     = useState(false)

  useEffect(() => {
    if (activePanel !== 'billing') return
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTransactionsLoading(true)
    fetchGroupTransactions(group.id)
      .then(data => { if (active) setTransactions(data) })
      .catch(() => { if (active) setTransactions([]) })
      .finally(() => { if (active) setTransactionsLoading(false) })
    return () => { active = false }
  }, [activePanel, group.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenLockGroup && group.status === 'full') setShowLockGroupConfirm(true)
  }, [autoOpenLockGroup]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenApplications) setActivePanel('applications')
  }, [autoOpenApplications])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenMemberInfo) setActivePanel('memberInfo')
  }, [autoOpenMemberInfo])

  function markGroupNotifsRead(type) {
    const user = useAuthStore.getState().getProfile()
    if (!user) return
    const notifStore = useNotificationStore.getState()
    notifStore.getByUserId(user.id)
      .filter(n => n.type === type && n.meta?.groupId === group.id && !n.isRead)
      .forEach(n => notifStore.markRead(n.id))
  }

  useEffect(() => {
    if (activePanel !== 'applications') return
    markGroupNotifsRead('new_application')
  }, [activePanel, group.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activePanel !== 'memberInfo') return
    useMemberStore.getState().init();
    markGroupNotifsRead('service_info_filled')
  }, [activePanel, group.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenBilling) setActivePanel('billing')
  }, [autoOpenBilling])

  useEffect(() => {
    if (autoOpenActivate) { openActivate(); onAutoOpenActivateDone?.() }
  }, [autoOpenActivate]) // eslint-disable-line react-hooks/exhaustive-deps

  const serviceDef    = getServiceById(group.serviceId)
  const planDef       = serviceDef?.plans.find(p => p.name === group.planName)
  const pendingApps   = applications.filter(a => a.status === 'pending')
  const groupFull     = group.openSeats <= 0

  const currentUserId = useAuthStore(s => s.user?.id);
  const submitReview  = useReviewStore(s => s.submit)
  const notifications = useNotificationStore(s => s.notifications)
  const unseenMemberInfoCount = useMemo(
    () => notifications.filter(
      n => n.type === 'service_info_filled' && n.userId === currentUserId && n.meta?.groupId === group.id && !n.isRead
    ).length,
    [notifications, currentUserId, group.id]
  )

  const canActivateNow  = group.status === 'pending_activation'

  const [finalConfirmed, setFinalConfirmed]         = useState(false)
  const [memberChecks, setMemberChecks]             = useState({})
  const [serviceIssueMember, setServiceIssueMember] = useState(null)
  const [serviceIssueNote, setServiceIssueNote]     = useState('')
  const [activating, setActivating]                 = useState(false)
  const serviceIssueEvidence = useEvidenceUpload(uploadServiceIssueEvidence)

  const allMembersChecked = members.length > 0 && members.every(m => memberChecks[m.id] && !m.serviceInfoIssueNote);

  function openActivate() {
    setShowActivate(true)
  }

  function closeActivate() {
    setShowActivate(false)
    setFinalConfirmed(false)
    setMemberChecks({})
  }

  async function handleActivateConfirm() {
    setActivating(true)
    try {
      await onActivate?.(null)
      setShowActivate(false)
      setFinalConfirmed(false)
      setMemberChecks({})
      onClose()
    } finally {
      setActivating(false)
    }
  }

  const lockGroupBanner = group.status === 'full' && (
    <div className="flex items-center justify-center bg-raised px-6 py-3 text-sm font-extrabold text-ink-2">
      招募完成，請點擊鎖定群組
    </div>
  )

  const needsCredentialsOnLock = isSharedCredentialsMethod(serviceDef?.sharingMethod);

  function openLockFlow() {
    if (needsCredentialsOnLock) {
      setCredentialValues({})
      setShowCredentialsModal(true)
    } else {
      setShowLockGroupConfirm(true)
    }
  }

  async function handleCredentialsSubmit(e) {
    e.preventDefault()
    setLockLoading(true)
    try {
      await onLockGroup?.(JSON.stringify(credentialValues))
      setShowCredentialsModal(false)
      setCredentialValues({})
    } finally {
      setLockLoading(false)
    }
  }

  async function handleAdjustBillingDateSubmit() {
    if (!newBillingDate || !billingDateNote.trim()) return
    setAdjustingBillingDate(true)
    try {
      await onAdjustBillingDate?.(newBillingDate, billingDateNote.trim())
      setShowAdjustBillingDate(false)
      setNewBillingDate('')
      setBillingDateNote('')
    } finally {
      setAdjustingBillingDate(false)
    }
  }

  const lockGroupCta = group.status === 'full' && (
    <div className="py-2">
      {showLockGroupConfirm ? (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            onClick={() => setShowLockGroupConfirm(false)}
            className="rounded-lg border border-line"
          >取消</Button>
          <Button
            variant="ink"
            onClick={() => { setShowLockGroupConfirm(false); onLockGroup?.(undefined) }}
            className="rounded-lg"
          >確認鎖定</Button>
        </div>
      ) : (
        <Button
          variant="ink"
          onClick={openLockFlow}
          className="w-full rounded-lg shadow-button"
        >
          <LockKeyhole size={15} strokeWidth={1.5} /> 鎖定群組
        </Button>
      )}
    </div>
  )

  const pendingConfirmationBanner = group.status === 'pending_confirmation' && (
    <div className="flex items-center justify-center gap-2 bg-info-subtle px-6 py-3 text-sm font-extrabold text-info-text">
      <Clock size={15} strokeWidth={1.5} />
      {needsCredentialsOnLock ? '等待成員提取帳號資訊' : '等待成員填寫服務帳號資訊'}
      {group.serviceInfoDeadline && (
        <>，剩餘 <CountdownText deadline={group.serviceInfoDeadline} /></>
      )}
    </div>
  )

  const confirmingBanner = group.status === 'confirming' && (
    <div className="flex items-center justify-center gap-2 bg-info-subtle px-6 py-3 text-sm font-extrabold text-info-text">
      <Clock size={15} strokeWidth={1.5} />確認期進行中
            {group.confirmDeadline && (
        <>，剩餘 <CountdownText deadline={group.confirmDeadline} /></>
      )}

      {!group.billingDateAdjustedAt && (
        <button
          onClick={() => { setNewBillingDate(''); setBillingDateNote(''); setShowAdjustBillingDate(true) }}
          className="ml-1 shrink-0 rounded-full border border-info-text/40 px-2.5 py-0.5 text-xs font-semibold text-info-text transition-all hover:-translate-y-0.5 hover:bg-info-text/10"
        >
          調整扣款日
        </button>
      )}
    </div>
  )

  const disputedBanner = group.status === 'disputed' && (
    <div className="flex items-center justify-center gap-2 bg-danger-subtle px-6 py-3 text-sm font-extrabold text-danger-text">
      <Clock size={15} strokeWidth={1.5} />
      收到問題回報，處理中
      {group.disputeDeadline && (
        <>，剩餘 <CountdownText deadline={group.disputeDeadline} /></>
      )}
    </div>
  )

  const activateBanner = canActivateNow && (
    <div className="flex items-center justify-center gap-2 bg-warning-subtle px-6 py-3 text-sm font-extrabold text-warning-text">
      <CheckCircle2 strokeWidth={1.5} size={15} />
      {needsCredentialsOnLock ? '所有成員已完成提取帳號資訊，可以啟用服務了' : '所有成員已完成填寫服務帳號，可以啟用服務了'}
    </div>
  )

  const activateCta = canActivateNow && (
    <div className="py-2">
      <Button
        onClick={openActivate}
        className="w-full rounded-lg shadow-button"
      >
        <PlayCircle strokeWidth={1.5} size={15} /> 啟用服務
      </Button>
    </div>
  )

  const isRecruiting = ['recruiting', 'full'].includes(group.status)
  const isCancelled = group.status === 'cancelled'
  const hasBeenActive = ['active', 'ended'].includes(group.status);
  const showRenewal = group.status === 'active'

  function openReviewHistory() {
    setShowReviewHistory(true)
    useApplicationStore.getState().init()
  }

  function buildSubPanel() {
    if (activePanel === 'members') {
      return buildMembersPanel({
        group, members, setActivePanel, onClose, setRemovingMember,
        setShowMemberReviews: () => { setReviewingMember(null); setShowMemberReviews(true) },
        showMemberReviewsButton: hasBeenActive,
        onReviewMember: m => setReviewTargetMember(m),
        showReviewButton: hasBeenActive,
      })
    }
    if (activePanel === 'applications') return buildApplicationsPanel({ pendingApps, groupFull, errors, onApprove, onReject, setActivePanel, setShowReviewHistory: openReviewHistory })
    if (activePanel === 'billing') return buildBillingPanel({ members, transactions, transactionsLoading, showRenewal, onOpenRenewal, escrowTokens: group.escrowTokens, isCancelled })
    if (activePanel === 'memberInfo') {
      return buildMemberInfoPanel({
        groupId: group.id,
        hostId: group.hostId,
        groupStatus: group.status,
        members,
        sharingMethod: serviceDef?.sharingMethod,
        sharedCredentials: group.sharedCredentials,
        serviceId: group.serviceId,
        canReportServiceIssue: canReportServiceIssue(group.status),
        onOpenServiceIssue: m => { setServiceIssueMember(m); setServiceIssueNote(m.serviceInfoIssueNote ?? '') },
        onResolveDispute: () => onResolveDispute?.(group.id),
        showPassword,
        onTogglePassword: () => setShowPassword(v => !v),
      });
    }
    return null
  }

  const isReviewHistory = showReviewHistory && activePanel === 'applications'
  const isMemberReviews = showMemberReviews && activePanel === 'members'

  function goToPanel(panel) {
    setActivePanel(panel)
    setShowReviewHistory(false)
    setShowMemberReviews(false)
    setReviewingMember(null)
  }

  function buildMemberReviewsContent() {
    if (reviewingMember) {
      return (
        <div className="flex min-h-full flex-col">
          <button
            onClick={() => setReviewingMember(null)}
            className="flex shrink-0 items-center gap-1.5 px-5 pt-5 text-xs font-medium text-ink-4 transition-colors hover:text-ink"
          >
            <ChevronLeft size={14} strokeWidth={1.5} /> 返回成員列表
          </button>
          <UserReviews
            userId={reviewingMember.userId}
            userName={reviewingMember.userName}
            avatarInitial={reviewingMember.userAvatarInitial}
            avatarColor={reviewingMember.userAvatarColor}
            presenceStatus={reviewingMember.userPresenceStatus}
            roleLabel="成員"
            groupId={group.id}
            title=""
            centerEmpty
          />
        </div>
      )
    }
    return (
      <div className="space-y-2 p-5">
        {members.map(m => (
          <button
            key={m.id}
            onClick={() => setReviewingMember(m)}
            className="flex w-full items-center gap-3 rounded-lg border border-line p-3 text-left transition-colors hover:border-brand"
          >
            <span className="relative inline-block shrink-0">
              <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
              <PresenceDot status={m.userPresenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{m.userName}</p>
          </button>
        ))}
      </div>
    )
  }

  function renderSideBar() {
    return (
      <>
        <GroupModalSideBarItem active={activePanel === null} onClick={() => goToPanel(null)}>
          <Info strokeWidth={1.5} size={17} /> 群組概覽
        </GroupModalSideBarItem>
        <GroupModalSideBarItem active={activePanel === 'members'} onClick={() => goToPanel('members')}>
          <Users strokeWidth={1.5} size={17} /> 群組名單
        </GroupModalSideBarItem>
        {isRecruiting && (
          <GroupModalSideBarItem
            active={activePanel === 'applications'}
            onClick={() => goToPanel('applications')}
            className="relative"
          >
            <span className="relative">
              <ClipboardList strokeWidth={1.5} size={17} />
              {pendingApps.length > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning-text px-0.5 text-2xs font-bold text-white">
                  {pendingApps.length}
                </span>
              )}
            </span>
            申請管理
          </GroupModalSideBarItem>
        )}
        <GroupModalSideBarItem active={activePanel === 'billing'} onClick={() => goToPanel('billing')}>
          <Banknote strokeWidth={1.5} size={17} />
          收款管理
        </GroupModalSideBarItem>
        {!isRecruiting && !isCancelled && (
          <GroupModalSideBarItem active={activePanel === 'memberInfo'} onClick={() => goToPanel('memberInfo')} className="relative">
            <span className="relative">
              <KeyRound strokeWidth={1.5} size={17} />
              {unseenMemberInfoCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning-text px-0.5 text-2xs font-bold text-white">
                  {unseenMemberInfoCount}
                </span>
              )}
            </span>
            帳號資訊
          </GroupModalSideBarItem>
        )}
        {isRecruiting ? (
          <GroupModalSideBarItem pinned tone="danger" onClick={() => setShowCancelConfirm(true)}>
            <Trash2 strokeWidth={1.5} size={17} /> 解散群組
          </GroupModalSideBarItem>
        ) : !isCancelled && (
          <>
            <GroupModalSideBarItem
              pinned
              onClick={() => {
                onClose()
                window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: group.id } }))
              }}
            >
              <MessageCircle strokeWidth={1.5} size={17} /> 群組訊息
            </GroupModalSideBarItem>
          </>
        )}
      </>
    )
  }

  return (
    <>

      {!showActivate && !serviceIssueMember && !showCredentialsModal && (
      <GroupModalShell
        onClose={onClose}
        group={group}
        service={serviceDef}
        plan={planDef}
        hideRecruitBar={group.status !== 'recruiting'}
        headerBanner={lockGroupBanner || activateBanner || pendingConfirmationBanner || confirmingBanner || disputedBanner || undefined}
        centeredCta={lockGroupCta || activateCta || undefined}
        extraInfoRows={[]}
        statusBadgeOverride={
          group.status === 'full' ? { variant: 'full', label: '等待鎖定' } :
          group.status === 'pending_confirmation' && needsCredentialsOnLock ? { variant: 'warning', label: '成員提取中' } :
          undefined
        }
        pendingBadge={
          group.status === 'pending_confirmation' ? (needsCredentialsOnLock ? '成員提取中' : '成員填寫中') :
          group.status === 'disputed' ? '收到問題回報，處理中' :
          undefined
        }
        pendingBadgeColor={group.status === 'disputed' ? 'danger' : undefined}
        subPanel={activePanel ? buildSubPanel() : null}
        onSubPanelBack={() => { setActivePanel(null); setShowReviewHistory(false); setShowMemberReviews(false); setReviewingMember(null) }}
        subSubPanel={
          isReviewHistory ? buildReviewHistoryPanel({ applications, groupFull, errors }) :
          isMemberReviews ? { floatingBack: true, content: buildMemberReviewsContent() } :
          null
        }
        onSubSubPanelBack={() => { setShowReviewHistory(false); setShowMemberReviews(false); setReviewingMember(null) }}
        panelKey={isReviewHistory ? 'reviewHistory' : isMemberReviews ? 'memberReviews' : activePanel ?? 'overview'}
        sideBar={renderSideBar()}
      />
      )}
      <LockGroupCredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => { setShowCredentialsModal(false); setCredentialValues({}) }}
        serviceId={group.serviceId}
        serviceName={group.serviceName}
        values={credentialValues}
        setValues={setCredentialValues}
        onSubmit={handleCredentialsSubmit}
        loading={lockLoading}
      />
      <ActivateServiceModal
        isOpen={showActivate}
        onClose={closeActivate}
        onConfirm={handleActivateConfirm}
        group={group}
        members={members}
        memberChecks={memberChecks}
        setMemberChecks={setMemberChecks}
        finalConfirmed={finalConfirmed}
        setFinalConfirmed={setFinalConfirmed}
        allMembersChecked={allMembersChecked}
        loading={activating}
      />
      <ReportServiceIssueModal
        member={serviceIssueMember}
        sharingMethod={serviceDef?.sharingMethod}
        onClose={() => {
          setServiceIssueMember(null)
          setServiceIssueNote('')
          serviceIssueEvidence.reset()
        }}
        note={serviceIssueNote}
        setNote={setServiceIssueNote}
        evidenceUrl={serviceIssueEvidence.url}
        evidenceName={serviceIssueEvidence.name}
        evidenceUploading={serviceIssueEvidence.uploading}
        onEvidenceSelect={serviceIssueEvidence.onSelect}
        onRemoveEvidence={serviceIssueEvidence.onRemove}
        onSubmit={() => {
          if (!serviceIssueNote.trim() || !serviceIssueMember) return
          onReportServiceInfoIssue?.(serviceIssueMember, serviceIssueNote.trim(), serviceIssueEvidence.key || undefined)
          setServiceIssueMember(null)
          setServiceIssueNote('')
          serviceIssueEvidence.reset()
        }}
      />
      {reviewTargetMember && (
        <ReviewUserModal
          target={{
            name: reviewTargetMember.userName,
            avatarInitial: reviewTargetMember.userAvatarInitial,
            avatarColor: reviewTargetMember.userAvatarColor,
            presenceStatus: reviewTargetMember.userPresenceStatus,
          }}
          subtitle={`${group.serviceName} · ${group.planName}`}
          onSubmit={({ rating, comment }) => submitReview({ groupId: group.id, revieweeId: reviewTargetMember.userId, rating, comment })}
          onClose={() => setReviewTargetMember(null)}
        />
      )}
      <AdjustBillingDateModal
        open={showAdjustBillingDate}
        currentDate={group.nextBillingDate}
        newDate={newBillingDate}
        setNewDate={setNewBillingDate}
        note={billingDateNote}
        setNote={setBillingDateNote}
        saving={adjustingBillingDate}
        onClose={() => { setShowAdjustBillingDate(false); setNewBillingDate(''); setBillingDateNote('') }}
        onSubmit={handleAdjustBillingDateSubmit}
      />
      {showCancelConfirm && (
        <ConfirmActionDialog
          title="解散群組"
          message={`確定要解散「${group.serviceName}」群組嗎？所有代管費用將退還給成員，此操作無法撤回。`}
          confirmLabel="解散群組"
          danger
          onConfirm={() => { setShowCancelConfirm(false); onCancelGroup?.() }}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}

      {removingMember && (
        <ConfirmActionDialog
          title="移除成員"
          message={`確定要將「${removingMember.userName}」移出群組嗎？`}
          confirmLabel="移除"
          danger
          onConfirm={() => { onRemoveMember?.(removingMember); setRemovingMember(null) }}
          onCancel={() => setRemovingMember(null)}
        />
      )}
    </>
  );
}
