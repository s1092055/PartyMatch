import { useEffect, useMemo, useState } from 'react'
import { Banknote, CheckCircle2, ClipboardList, Clock, Info, KeyRound, LockKeyhole, MessageCircle, PlayCircle, RefreshCw, Trash2, TriangleAlert, Users } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import ConfirmActionDialog from '../../../components/ui/ConfirmActionDialog'
import CountdownText from '../../../components/ui/primitives/CountdownText'
import GroupModalShell from '../../../components/ui/group/GroupModalShell'
import GroupModalSideBarItem from '../../../components/ui/group/GroupModalSideBarItem'
import ReviewUserModal from '../../subscriptions/components/ReviewUserModal'
import { getServiceById } from '../../../common/utils/serviceUtils'
import { isSharedCredentialsMethod } from '../../../common/utils/serviceInfoFields'
import { canReportServiceIssue } from '../../../common/utils/groupStatus'
import { daysUntil } from '../../../common/utils/date'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { useApplicationStore } from '../../../common/stores/useApplicationStore'
import { useGroupStore } from '../../../common/stores/useGroupStore'
import { useMemberStore } from '../../../common/stores/useMemberStore'
import { useNotificationStore } from '../../../common/stores/useNotificationStore'
import { useReviewStore } from '../../../common/stores/useReviewStore'
import { fetchGroupTransactions } from '../../../common/api/groupsApi'
import { uploadServiceIssueEvidence, uploadPlatformReportEvidence } from '../../../common/api/storageApi'
import { createPlatformReport } from '../../../common/api/platformReportsApi'
import { useEvidenceUpload } from '../../../common/utils/hooks'
import { toast } from '../../../common/utils/toast'
import ActivateServiceModal from './ActivateServiceModal'
import ReportServiceIssueModal from './ReportServiceIssueModal'
import ReportPlatformIssueModal from '../../group/components/ReportPlatformIssueModal'
import LockGroupCredentialsModal from './LockGroupCredentialsModal'
import AdjustBillingDateModal from './AdjustBillingDateModal'
import { buildMembersPanel } from './hostGroupView/buildMembersPanel'
import { buildApplicationsPanel } from './hostGroupView/buildApplicationsPanel'
import { buildReviewHistoryPanel } from './hostGroupView/buildReviewHistoryPanel'
import { buildBillingPanel } from './hostGroupView/buildBillingPanel'
import { buildMemberInfoPanel } from './hostGroupView/buildMemberInfoPanel'

export default function HostGroupView(
  { group, members, applications, onReportServiceInfoIssue, onResolveDispute, onEscalateDispute, onRemoveMember, onActivate, onLockGroup, onCancelGroup, onApprove, onReject, onAdjustBillingDate, errors, onClose, autoOpenLockGroup, autoOpenActivate, onAutoOpenActivateDone, autoOpenApplications, autoOpenBilling, autoOpenMemberInfo, onOpenRenewal }
) {
  const [showActivate, setShowActivate]                   = useState(false)
  const [removingMember, setRemovingMember]               = useState(null)
  const [activePanel, setActivePanel]                     = useState(null);
  const [headerStatus, setHeaderStatus]                    = useState(group.status);
  const [panelTick, setPanelTick]                          = useState(0);
  const [dataSyncTick, setDataSyncTick]                     = useState(0);
  const [showReviewHistory, setShowReviewHistory]         = useState(false)
  const [reviewTargetMember, setReviewTargetMember]        = useState(null)
  const [showLockGroupConfirm, setShowLockGroupConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm]         = useState(false)
  const [showPlatformReport, setShowPlatformReport]         = useState(false)
  const [platformReportDescription, setPlatformReportDescription] = useState('')
  const [submittingPlatformReport, setSubmittingPlatformReport]   = useState(false)
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
  }, [activePanel, group.id, panelTick])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenLockGroup && group.status === 'full') setShowLockGroupConfirm(true)
  }, [autoOpenLockGroup]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenApplications) setActivePanel('applications')
  }, [autoOpenApplications])

  useEffect(() => {
    // 停留在申請管理等分頁時，群組額滿等狀態變化不應該讓鎖定群組按鈕/banner 立刻跳出來，
    // 只有切換分頁（或重複點擊同一分頁刷新，並且資料真的刷新完成）時才讓 header 這塊呈現最新的群組狀態
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeaderStatus(group.status)
  }, [activePanel, dataSyncTick]) // eslint-disable-line react-hooks/exhaustive-deps

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
    // 重複點擊同一個分頁（panelTick 遞增）也要重新標記已讀，
    // 不然停留在該分頁時新收到的通知，右上角紅點會一直卡著不消失
    if (activePanel !== 'applications') return
    markGroupNotifsRead('new_application')
  }, [activePanel, group.id, panelTick]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // 重複點擊同一分頁（panelTick 遞增）也要重新刷新成員資料、重新標記已讀
    if (activePanel !== 'memberInfo') return
    useMemberStore.getState().init().catch(console.error)
    markGroupNotifsRead('service_info_filled')
  }, [activePanel, group.id, panelTick]) // eslint-disable-line react-hooks/exhaustive-deps

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
  const platformReportEvidence = useEvidenceUpload(uploadPlatformReportEvidence)

  async function handleSubmitPlatformReport() {
    if (!platformReportDescription.trim()) return
    setSubmittingPlatformReport(true)
    try {
      await createPlatformReport({
        groupId:     group.id,
        description: platformReportDescription.trim(),
        evidenceUrl: platformReportEvidence.key,
      })
      toast('回報已送出，客服會盡快協助處理', 'success')
      setShowPlatformReport(false)
      setPlatformReportDescription('')
      platformReportEvidence.reset()
    } catch (err) {
      toast(err?.message ?? '回報失敗，請稍後再試', 'error')
    } finally {
      setSubmittingPlatformReport(false)
    }
  }

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

  const lockGroupBanner = headerStatus === 'full' && (
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

  const lockGroupCta = headerStatus === 'full' && (
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
  const showRenewal = group.status === 'active' && !!group.nextBillingDate && daysUntil(group.nextBillingDate) <= 7

  const renewalCta = showRenewal && (
    <div className="py-2">
      <Button
        onClick={() => onOpenRenewal?.()}
        className="w-full rounded-lg shadow-button"
      >
        <RefreshCw size={15} strokeWidth={1.5} /> 續訂服務
      </Button>
    </div>
  )

  function openReviewHistory() {
    setShowReviewHistory(true)
    useApplicationStore.getState().init()
  }

  function openGroupMessages() {
    onClose()
    window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: group.id } }))
  }

  function buildSubPanel() {
    if (activePanel === 'members') {
      return buildMembersPanel({
        group, members, setActivePanel, onClose, setRemovingMember,
        onReviewMember: m => setReviewTargetMember(m),
        showReviewButton: hasBeenActive,
      })
    }
    if (activePanel === 'applications') return buildApplicationsPanel({ pendingApps, groupFull, errors, onApprove, onReject, setShowReviewHistory: openReviewHistory })
    if (activePanel === 'billing') return buildBillingPanel({ members, groupMembers: group.members, transactions, transactionsLoading, showRenewal, currentCycle: group.currentCycle, isCancelled })
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
        onResolveDispute: (memberId, note) => onResolveDispute?.(group.id, memberId, note),
        onEscalateDispute: (memberId, note) => onEscalateDispute?.(group.id, memberId, note),
        showPassword,
        onTogglePassword: () => setShowPassword(v => !v),
      });
    }
    return null
  }

  const isReviewHistory = showReviewHistory && activePanel === 'applications'

  async function goToPanel(panel) {
    // 切換分頁、重播 slide-up 動畫不用等資料回來，立刻反應
    setPanelTick(t => t + 1)
    setActivePanel(panel)
    setShowReviewHistory(false)
    // header 快照（headerStatus）要等資料真的刷新完才能重新同步，不然會抓到還沒更新的舊資料
    await Promise.all([
      useGroupStore.getState().refreshGroup(group.id).catch(console.error),
      useMemberStore.getState().init().catch(console.error),
      useApplicationStore.getState().init().catch(console.error),
    ])
    setDataSyncTick(t => t + 1)
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
              className="hidden md:flex"
              onClick={openGroupMessages}
            >
              <MessageCircle strokeWidth={1.5} size={17} /> 群組訊息
            </GroupModalSideBarItem>
            <GroupModalSideBarItem onClick={() => setShowPlatformReport(true)}>
              <TriangleAlert strokeWidth={1.5} size={17} /> 回報問題
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
        hideRecruitBar={headerStatus !== 'recruiting'}
        headerBanner={lockGroupBanner || activateBanner || pendingConfirmationBanner || confirmingBanner || disputedBanner || undefined}
        centeredCta={lockGroupCta || activateCta || renewalCta || undefined}
        extraInfoRows={[]}
        statusBadgeOverride={
          headerStatus === 'full' ? { variant: 'full', label: '等待鎖定' } :
          group.status === 'pending_confirmation' && needsCredentialsOnLock ? { variant: 'pending_confirmation', label: '成員提取中' } :
          undefined
        }
        pendingBadge={
          group.status === 'pending_confirmation' ? (needsCredentialsOnLock ? '成員提取中' : '成員填寫中') :
          group.status === 'disputed' ? '收到問題回報，處理中' :
          undefined
        }
        pendingBadgeColor={group.status === 'disputed' ? 'danger' : undefined}
        subPanel={activePanel ? buildSubPanel() : null}
        onSubPanelBack={() => { setActivePanel(null); setShowReviewHistory(false) }}
        subSubPanel={
          isReviewHistory ? buildReviewHistoryPanel({ applications, groupFull, errors }) :
          null
        }
        onSubSubPanelBack={() => { setShowReviewHistory(false) }}
        panelKey={isReviewHistory ? 'reviewHistory' : `${activePanel ?? 'overview'}-${panelTick}`}
        sideBar={renderSideBar()}
        mobileFab={!isRecruiting && !isCancelled && (
          <button
            type="button"
            onClick={openGroupMessages}
            aria-label="群組訊息"
            className="grid h-12 w-12 place-items-center rounded-full border border-line bg-surface text-ink-2 shadow-floating transition-all hover:-translate-y-0.5 hover:bg-brand-subtle hover:text-brand"
          >
            <MessageCircle strokeWidth={1.5} size={20} />
          </button>
        )}
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
        evidenceProgress={serviceIssueEvidence.progress}
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
      <ReportPlatformIssueModal
        isOpen={showPlatformReport}
        onClose={() => {
          setShowPlatformReport(false)
          setPlatformReportDescription('')
          platformReportEvidence.reset()
        }}
        description={platformReportDescription}
        setDescription={setPlatformReportDescription}
        evidenceUrl={platformReportEvidence.url}
        evidenceName={platformReportEvidence.name}
        evidenceUploading={platformReportEvidence.uploading}
        evidenceProgress={platformReportEvidence.progress}
        onEvidenceSelect={platformReportEvidence.onSelect}
        onRemoveEvidence={platformReportEvidence.onRemove}
        submitting={submittingPlatformReport}
        onSubmit={handleSubmitPlatformReport}
      />
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
