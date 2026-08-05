import { useEffect, useMemo, useState } from 'react'
import { Banknote, CheckCircle2, ClipboardList, Clock, FileText, Info, LockKeyhole, MessageCircle, PlayCircle, RefreshCw, Trash2, Users } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import ConfirmActionDialog from '../../../components/ui/ConfirmActionDialog'
import CountdownText from '../../../components/ui/primitives/CountdownText'
import DisputeReasonDialog from '../../../components/ui/DisputeReasonDialog'
import GroupModalShell from '../../../components/ui/group/GroupModalShell'
import GroupModalSideBarItem from '../../../components/ui/group/GroupModalSideBarItem'
import HostReviews from '../../group/components/HostReviews'
import { getServiceById } from '../../../common/utils/serviceUtils'
import { canReportServiceIssue } from '../../../common/utils/groupStatus'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { useApplicationStore } from '../../../common/stores/useApplicationStore'
import { useMemberStore } from '../../../common/stores/useMemberStore'
import { useNotificationStore } from '../../../common/stores/useNotificationStore'
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

// ── 團主視角 ──────────────────────────────────────────────────────────────────

export default function HostGroupView({ group, members, applications, onReportServiceInfoIssue, onRemoveMember, onActivate, onLockGroup, onCancelGroup, onApprove, onReject, onAdjustBillingDate, errors, onClose, autoOpenLockGroup, autoOpenActivate, onAutoOpenActivateDone, autoOpenApplications, autoOpenBilling, autoOpenMemberInfo, onOpenRenewal }) {
  const [showActivate, setShowActivate]                   = useState(false)
  const [removingMember, setRemovingMember]               = useState(null)
  const [activePanel, setActivePanel]                     = useState(null) // 'members' | 'applications' | 'billing' | 'reviews' | null
  const [showReviewHistory, setShowReviewHistory]         = useState(false)
  const [showMemberReviews, setShowMemberReviews]         = useState(false)
  const [showLockGroupConfirm, setShowLockGroupConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm]         = useState(false)
  const [transactions, setTransactions]                     = useState([])
  const [transactionsLoading, setTransactionsLoading]       = useState(false)
  const [showCredentialsModal, setShowCredentialsModal]     = useState(false)
  const [credentialValues, setCredentialValues]             = useState({})
  const [lockLoading, setLockLoading]                       = useState(false)
  const [showDisputeReason, setShowDisputeReason]           = useState(false)
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

  // 側邊欄分頁自帶未讀 badge 的兩個分頁（申請管理／成員資料）共用同一套「開啟時標記已讀」邏輯，
  // 差別只在通知類型跟 group.id 篩選條件，抽成小函式避免同一段邏輯抄第二次
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
    // 每次打開「成員資料」都重新拉一次，避免看到的是成員填寫當下、輪詢還沒同步到的舊快取
    useMemberStore.getState().init()
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

  // 成員資料分頁的數字 badge：跟「申請管理」同一套樣式，顯示有幾筆未讀的 service_info_filled 通知
  // （成員填寫服務帳號、團主還沒點開看過）
  const currentUserId = useAuthStore(s => s.user?.id)
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
  const serviceIssueEvidence = useEvidenceUpload(uploadServiceIssueEvidence)

  // 勾選狀態現在會跨越「關閉啟用服務→去成員資料回報問題→重新打開」保留，
  // 光看 memberChecks 會漏掉「勾選之後才回報的問題」，一定要一起檢查 serviceInfoIssueNote
  // 才能擋下帶著未解決問題的成員被算進「全員已確認」
  const allMembersChecked = members.length > 0 && members.every(m => memberChecks[m.id] && !m.serviceInfoIssueNote)

  function openActivate() {
    setShowActivate(true)
  }

  // 關閉 modal 視同放棄本次確認進度，重新打開要整輪重新勾選
  function closeActivate() {
    setShowActivate(false)
    setFinalConfirmed(false)
    setMemberChecks({})
  }

  function handleActivateConfirm() {
    onActivate?.(null)
    setShowActivate(false)
    setFinalConfirmed(false)
    setMemberChecks({})
    onClose()
  }

  const lockGroupBanner = group.status === 'full' && (
    <div className="flex items-center justify-center bg-raised px-6 py-3 text-sm font-extrabold text-ink-2">
      招募完成，請點擊鎖定群組
    </div>
  )

  // 無官方多人邀請機制的服務，鎖定群組當下順便讓團主提供帳號密碼，成員填寫帳號時就能直接看到，
  // 不用回頭翻聊天室訊息
  const needsCredentialsOnLock = serviceDef?.sharingMethod === 'shared_credentials'

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
          className="w-full rounded-lg shadow-md"
        >
          <LockKeyhole size={15} strokeWidth={1.5} /> 鎖定群組
        </Button>
      )}
    </div>
  )

  const pendingConfirmationBanner = group.status === 'pending_confirmation' && (
    <div className="flex items-center justify-center gap-2 bg-info-subtle px-6 py-3 text-sm font-extrabold text-info-text">
      <Clock size={15} strokeWidth={1.5} />
      等待成員填寫服務帳號資訊
      {group.serviceInfoDeadline && (
        <>，剩餘 <CountdownText deadline={group.serviceInfoDeadline} /></>
      )}
    </div>
  )

  const confirmingBanner = group.status === 'confirming' && (
    <div className="flex items-center justify-center gap-2 bg-info-subtle px-6 py-3 text-sm font-extrabold text-info-text">
      <Clock size={15} strokeWidth={1.5} />
      確認期進行中
      {group.confirmDeadline && (
        <>，剩餘 <CountdownText deadline={group.confirmDeadline} /></>
      )}
      {/* 每期只能調整一次，已經用掉額度就不再顯示按鈕，避免點了才發現後端擋掉 */}
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

  const disputeMember = group.status === 'disputed' ? members.find(m => m.serviceInfoIssueNote) : null

  const disputedBanner = group.status === 'disputed' && (
    <div className="flex items-center justify-center gap-2 bg-danger-subtle px-6 py-3 text-sm font-extrabold text-danger-text">
      <Clock size={15} strokeWidth={1.5} />
      收到問題回報，處理中
      {group.disputeDeadline && (
        <>，剩餘 <CountdownText deadline={group.disputeDeadline} /></>
      )}
      <button
        onClick={() => setShowDisputeReason(true)}
        className="ml-1 shrink-0 rounded-full border border-danger-text/40 px-2.5 py-0.5 text-xs font-semibold text-danger-text transition-all hover:-translate-y-0.5 hover:bg-danger-text/10"
      >
        查看原因
      </button>
    </div>
  )

  const activateBanner = canActivateNow && (
    <div className="flex items-center justify-center gap-2 bg-warning-subtle px-6 py-3 text-sm font-extrabold text-warning-text">
      <CheckCircle2 size={15} />
      所有成員已完成填寫服務帳號，可以啟用服務了
    </div>
  )

  const activateCta = canActivateNow && (
    <div className="py-2">
      <Button
        onClick={openActivate}
        className="w-full rounded-lg shadow-md"
      >
        <PlayCircle size={15} /> 啟用服務
      </Button>
    </div>
  )

  const isRecruiting = ['recruiting', 'full'].includes(group.status)
  const isCancelled = group.status === 'cancelled'
  // 成員評價要群組真的啟用過才會有資料，招募/處理中階段成員根本還沒用服務、不可能有評價
  const hasBeenActive = ['active', 'ended'].includes(group.status)

  // 審核紀錄要看得到成員最新的退出/移除狀態，點開當下重新拉一次申請資料，避免顯示舊快取
  function openReviewHistory() {
    setShowReviewHistory(true)
    useApplicationStore.getState().init()
  }

  function buildSubPanel() {
    if (activePanel === 'members') return buildMembersPanel({ group, members, setActivePanel, onClose, setRemovingMember, setShowMemberReviews: () => setShowMemberReviews(true), showMemberReviewsButton: hasBeenActive })
    if (activePanel === 'applications') return buildApplicationsPanel({ pendingApps, groupFull, errors, onApprove, onReject, setActivePanel, setShowReviewHistory: openReviewHistory })
    if (activePanel === 'billing') return buildBillingPanel({ members, transactions, transactionsLoading })
    if (activePanel === 'memberInfo') {
      return buildMemberInfoPanel({
        members,
        sharingMethod: serviceDef?.sharingMethod,
        sharedCredentials: group.sharedCredentials,
        serviceId: group.serviceId,
        // 服務啟用後成員已經確認帳號能正常使用，「帳號資訊有誤」這個理由就不成立了，
        // 回報帳號問題只開放在啟用服務之前（還在填寫/等待啟用階段）
        canReportServiceIssue: canReportServiceIssue(group.status),
        onOpenServiceIssue: m => { setServiceIssueMember(m); setServiceIssueNote(m.serviceInfoIssueNote ?? '') },
      })
    }
    return null
  }

  const isReviewHistory = showReviewHistory && activePanel === 'applications'
  const isMemberReviews = showMemberReviews && activePanel === 'members'

  // 側邊欄一律視為「換到別的分頁」，一併離開審核紀錄／成員評價，避免之後再點回申請管理時卡在裡面出不去
  function goToPanel(panel) {
    setActivePanel(panel)
    setShowReviewHistory(false)
    setShowMemberReviews(false)
  }

  function renderSideBar() {
    const showRenewal = group.status === 'active'
    return (
      <>
        <GroupModalSideBarItem active={activePanel === null} onClick={() => goToPanel(null)}>
          <Info size={17} /> 群組概覽
        </GroupModalSideBarItem>
        <GroupModalSideBarItem active={activePanel === 'members'} onClick={() => goToPanel('members')}>
          <Users size={17} /> 群組名單
        </GroupModalSideBarItem>
        {isRecruiting && (
          <GroupModalSideBarItem
            active={activePanel === 'applications'}
            onClick={() => goToPanel('applications')}
            className="relative"
          >
            <span className="relative">
              <ClipboardList size={17} />
              {pendingApps.length > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning-text px-0.5 text-2xs font-bold text-white">
                  {pendingApps.length}
                </span>
              )}
            </span>
            申請管理
          </GroupModalSideBarItem>
        )}
        {!isCancelled && (
          <GroupModalSideBarItem active={activePanel === 'billing'} onClick={() => goToPanel('billing')}>
            <Banknote size={17} />
            收款管理
          </GroupModalSideBarItem>
        )}
        {!isRecruiting && !isCancelled && (
          <GroupModalSideBarItem active={activePanel === 'memberInfo'} onClick={() => goToPanel('memberInfo')} className="relative">
            <span className="relative">
              <FileText size={17} />
              {unseenMemberInfoCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning-text px-0.5 text-2xs font-bold text-white">
                  {unseenMemberInfoCount}
                </span>
              )}
            </span>
            成員資料
          </GroupModalSideBarItem>
        )}
        {isRecruiting ? (
          <GroupModalSideBarItem pinned tone="danger" onClick={() => setShowCancelConfirm(true)}>
            <Trash2 size={17} /> 解散群組
          </GroupModalSideBarItem>
        ) : !isCancelled && (
          <>
            {showRenewal && (
              <GroupModalSideBarItem pinned onClick={() => onOpenRenewal?.()}>
                <RefreshCw size={17} /> 續訂管理
              </GroupModalSideBarItem>
            )}
            <GroupModalSideBarItem
              pinned
              onClick={() => {
                onClose()
                window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: group.id } }))
              }}
            >
              <MessageCircle size={17} /> 群組訊息
            </GroupModalSideBarItem>
          </>
        )}
      </>
    )
  }

  return (
    <>
    {/* 啟用服務／回報帳號問題這兩個 sub-modal 開啟時，完全隱藏底下的群組詳情 modal，不是疊加半透明遮罩；
        關閉 sub-modal 才重新顯示群組詳情，跟成員端「填寫服務帳號」sub-modal 同一套模式 */}
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
      statusBadgeOverride={group.status === 'full' ? { variant: 'full', label: '等待鎖定' } : undefined}
      pendingBadge={
        group.status === 'pending_confirmation' ? '成員填寫中' :
        group.status === 'disputed' ? '收到問題回報，處理中' :
        undefined
      }
      pendingBadgeColor={group.status === 'disputed' ? 'danger' : undefined}
      subPanel={activePanel ? buildSubPanel() : null}
      onSubPanelBack={() => { setActivePanel(null); setShowReviewHistory(false); setShowMemberReviews(false) }}
      subSubPanel={
        isReviewHistory ? buildReviewHistoryPanel({ applications, groupFull, errors }) :
        isMemberReviews ? { floatingBack: true, content: <div className="flex min-h-full flex-col"><HostReviews group={group} groupId={group.id} title="" centerEmpty /></div> } :
        null
      }
      onSubSubPanelBack={() => { setShowReviewHistory(false); setShowMemberReviews(false) }}
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
        onReportServiceInfoIssue?.(serviceIssueMember, serviceIssueNote.trim(), serviceIssueEvidence.url || undefined)
        setServiceIssueMember(null)
        setServiceIssueNote('')
        serviceIssueEvidence.reset()
      }}
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

    {showDisputeReason && (
      <DisputeReasonDialog
        reporterName={disputeMember?.userName}
        reporterAvatarInitial={disputeMember?.userAvatarInitial}
        reporterAvatarColor={disputeMember?.userAvatarColor}
        reason={disputeMember?.serviceInfoIssueNote}
        evidenceUrl={disputeMember?.disputeEvidenceUrl}
        onClose={() => setShowDisputeReason(false)}
      />
    )}

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

    {/* 移除成員確認（倒數 5 秒才可確認） */}
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
  )
}
