import { useEffect, useState } from 'react'
import {
  Banknote, CheckCircle2, Clock, Info, LogOut, MessageCircle, Users, ClipboardEdit, AlertTriangle, KeyRound,
} from 'lucide-react'
import { Avatar } from '../../../components/ui/avatar'
import { PresenceDot } from '../../../common/layout/components/navShared'
import { Button } from '../../../components/ui/button'
import ConfirmActionDialog from '../../../components/ui/ConfirmActionDialog'
import ConfirmServiceModal from './ConfirmServiceModal'
import CountdownText from '../../../components/ui/primitives/CountdownText'
import GroupModalShell from '../../../components/ui/group/GroupModalShell'
import GroupModalSideBarItem from '../../../components/ui/group/GroupModalSideBarItem'
import UserReviews from '../../group/components/UserReviews'
import ReviewUserModal from './ReviewUserModal'
import FillServiceInfoModal from './FillServiceInfoModal'
import DisputeModal from './DisputeModal'
import { buildPaymentsPanel } from './memberGroupView/buildPaymentsPanel'
import { buildCredentialsPanel } from './memberGroupView/buildCredentialsPanel'
import { getServiceById } from '../../../common/utils/serviceUtils'
import { getSharingMethodConfig, hasFilledServiceInfo, isSharedCredentialsMethod, serviceHasProfileField } from '../../../common/utils/serviceInfoFields'
import { useMemberStore } from '../../../common/stores/useMemberStore'
import { useGroupStore } from '../../../common/stores/useGroupStore'
import { useSubscriptionStore } from '../../../common/stores/useSubscriptionStore'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { useReviewStore } from '../../../common/stores/useReviewStore'
import { uploadDisputeEvidence } from '../../../common/api/storageApi'
import { fetchGroupTokenTransactions } from '../../../common/api/tokensApi'
import { toast } from '../../../common/utils/toast'
import { useEvidenceUpload } from '../../../common/utils/hooks'
import { isHistoryGroup } from '../../../common/utils/groupStatusDisplay'

export default function MemberGroupView({ group, onLeaveGroup, onClose, autoOpenCredentials }) {
  const [activePanel, setActivePanel] = useState(null);
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [showFillInfo, setShowFillInfo] = useState(false)
  const [showDispute, setShowDispute] = useState(false)
  const [fillValues, setFillValues] = useState({})
  const [fillLoading, setFillLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [confirmServiceAgreed, setConfirmServiceAgreed] = useState(false)
  const [disputeReasons, setDisputeReasons] = useState([])
  const [disputeDetail, setDisputeDetail] = useState('')
  const [disputeLoading, setDisputeLoading] = useState(false)
  const evidence = useEvidenceUpload(uploadDisputeEvidence)
  const [reviewPrompt, setReviewPrompt] = useState(null);
  const [transactions, setTransactions] = useState([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenCredentials) setActivePanel('credentials')
  }, [autoOpenCredentials]);

  useEffect(() => {
    if (activePanel !== 'payments' && !confirmDialog) return
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTransactionsLoading(true)
    fetchGroupTokenTransactions(group.id)
      .then(({ transactions: groupTransactions }) => {
        if (active) setTransactions(groupTransactions)
      })
      .catch(() => { if (active) setTransactions([]) })
      .finally(() => { if (active) setTransactionsLoading(false) })
    return () => { active = false }
  }, [activePanel, confirmDialog, group.id])

  const currentUser = useAuthStore(s => s.user)
  const allMembers  = useMemberStore(s => s.members)
  const subscriptions = useSubscriptionStore(s => s.subscriptions)
  const fillServiceInfo = useMemberStore(s => s.fillServiceInfo)
  const markConfirmed   = useMemberStore(s => s.markConfirmed)
  const confirmService  = useGroupStore(s => s.confirmService)
  const disputeGroup    = useGroupStore(s => s.disputeGroup)
  const submitReview    = useReviewStore(s => s.submit)
  const members     = allMembers.filter(m => m.groupId === group.id)
  const sub         = currentUser ? (subscriptions.find(s => s.userId === currentUser.id && s.groupId === group.id) ?? null) : null
  const myMember    = currentUser ? members.find(m => m.userId === currentUser.id) ?? null : null

  const serviceDef        = getServiceById(group.serviceId)
  const planDef           = serviceDef?.plans.find(p => p.name === group.planName)
  const isPaymentRelevant = !['recruiting', 'full', 'cancelled'].includes(group.status)

  const isSharedCredentials = isSharedCredentialsMethod(serviceDef?.sharingMethod);
  const showsProfileName    = isSharedCredentials && serviceHasProfileField(serviceDef?.id)
  const hasServiceInfoIssue = !!myMember?.serviceInfoIssueNote && group.status !== 'disputed' && !isHistoryGroup(group);
  const sharingMethodConfig = getSharingMethodConfig(serviceDef?.sharingMethod, serviceDef?.id, { hasServiceInfoIssue })
  const hasServiceInfo      = hasFilledServiceInfo(myMember?.serviceInfo, serviceDef?.sharingMethod, serviceDef?.id) && !hasServiceInfoIssue
  const canViewCredentials  = isSharedCredentials && isPaymentRelevant && (hasServiceInfo || hasServiceInfoIssue);
  const needsFillInfo       = !!sub && isPaymentRelevant && !hasServiceInfo && group.status === 'pending_confirmation'
  const waitingForOthers    = !!sub && hasServiceInfo && group.status === 'pending_confirmation';
  const canLeaveGroup       = ['recruiting', 'full'].includes(group.status) && !!myMember
  const isDisputed          = group.status === 'disputed'
  const isDisputeRaiser     = isDisputed && !!myMember?.serviceInfoIssueNote;
  // 確認期每位成員彼此獨立：group 進入 disputed 只影響提出問題的當事人本人，
  // 其他成員不受影響，繼續當成一般確認期處理
  const isConfirmingLike    = group.status === 'confirming' || (isDisputed && !isDisputeRaiser)
  const canConfirm          = isConfirmingLike && !!myMember && !myMember.confirmedAt
  const alreadyConfirmed    = isConfirmingLike && !!myMember?.confirmedAt
  const disputedBannerText  = '回報處理中'

  function selectPanel(panel) {
    if (panel === activePanel) return
    setActivePanel(panel)
    useGroupStore.getState().refreshGroup(group.id).catch(console.error)
    useMemberStore.getState().init().catch(console.error)
    useSubscriptionStore.getState().init().catch(console.error)
  }

  function openMessages() {
    onClose()
    window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: group.id } }))
  }

  function openDmWithHost() {
    onClose()
    window.dispatchEvent(new CustomEvent('pm:open-dm', {
      detail: { hostId: group.hostId, hostName: group.hostName, hostAvatarInitial: group.hostAvatarInitial, hostAvatarColor: group.hostAvatarColor },
    }))
  }

  const hostReviews = (
    <UserReviews
      userId={group.hostId}
      userName={group.hostName}
      avatarInitial={group.hostAvatarInitial}
      avatarColor={group.hostAvatarColor}
      presenceStatus={group.hostPresenceStatus}
      bio={group.hostBio}
      roleLabel="團主"
      headerClassName="text-lg font-black text-brand"
      onDm={openDmWithHost}
      scrollable
    />
  )

  async function handleConfirmService() {
    setConfirmLoading(true)
    try {
      const res = await confirmService(group.id)
      setConfirmDialog(false)
      setConfirmServiceAgreed(false)
      if (res.released) {
        useSubscriptionStore.getState().init().catch(console.error)
        toast('確認完成，款項已撥付給團主！', 'success')
      } else {
        if (myMember) markConfirmed(myMember.id)
        toast('已確認，等待其他成員確認中', 'success')
      }
      setReviewPrompt({ closeOnDone: !!res.released })
    } catch (err) {
      toast(err?.message ?? '確認失敗，請稍後再試', 'error')
    } finally {
      setConfirmLoading(false)
    }
  }

  function toggleDisputeReason(option) {
    setDisputeReasons(prev => prev.includes(option) ? prev.filter(r => r !== option) : [...prev, option])
  }

  function resetDisputeForm() {
    setDisputeReasons([])
    setDisputeDetail('')
    evidence.reset()
  }

  async function handleDisputeSubmit(e) {
    e.preventDefault()
    if (disputeReasons.length === 0) return
    const reason = [disputeReasons.join('、'), disputeDetail.trim()].filter(Boolean).join('\n')
    setDisputeLoading(true)
    try {
      await disputeGroup(group.id, { reason, evidenceUrl: evidence.key || undefined })
      setShowDispute(false)
      resetDisputeForm()
      toast('已送出回報，將於 48 小時內處理', 'success')
      onClose()
    } catch (err) {
      toast(err?.message ?? '回報失敗，請稍後再試', 'error')
    } finally {
      setDisputeLoading(false)
    }
  }

  const fillValid = myMember && sharingMethodConfig.fields.every(({ key, type }) =>
    type === 'checkbox' ? fillValues[key] === true : !!fillValues[key]?.trim()
  )

  async function handleFillSubmit(e) {
    e.preventDefault()
    if (!fillValid) return
    setFillLoading(true)
    try {
      const serviceInfo = Object.fromEntries(
        sharingMethodConfig.fields.map(({ key, type }) => [key, type === 'checkbox' ? true : fillValues[key].trim()])
      )
      await fillServiceInfo(myMember.id, group.id, serviceInfo)
      setShowFillInfo(false)
      toast('帳號資訊已送出', 'success')
    } catch (err) {
      toast(err?.message ?? '送出失敗，請稍後再試', 'error')
    } finally {
      setFillLoading(false)
    }
  }

  function openFillInfoModal() {
    setFillValues(myMember?.serviceInfo ?? {})
    setShowFillInfo(true)
  }

  const fillInfoCta = (needsFillInfo || hasServiceInfoIssue) && (
    <div className="py-2">
      <Button
        variant={hasServiceInfoIssue ? 'destructive' : 'default'}
        onClick={openFillInfoModal}
        className="w-full rounded-lg shadow-button"
      >
        <ClipboardEdit strokeWidth={1.5} size={15} />
        {hasServiceInfoIssue ? '修正帳號資訊' : isSharedCredentials ? '提取帳號資訊' : '填寫帳號'}
      </Button>
    </div>
  );

  const confirmCta = canConfirm && (
    <div className="grid grid-cols-2 gap-2 p-2">
      <Button
        onClick={() => setConfirmDialog(true)}
        disabled={confirmLoading}
        className="rounded-lg shadow-button"
      >
        <CheckCircle2 strokeWidth={1.5} size={15} /> 確認服務
      </Button>
      <Button
        variant="destructive"
        onClick={() => { resetDisputeForm(); setShowDispute(true) }}
        className="rounded-lg shadow-button"
      >
        <AlertTriangle strokeWidth={1.5} size={14} /> 回報問題
      </Button>
    </div>
  )

  function buildSubPanel() {
    if (activePanel === 'members') {
      return {
        content: (
          <div className="p-5 space-y-2">
            <div className="rounded-lg border border-line p-3">
              <div className="flex items-center gap-3">
                <span className="relative inline-block shrink-0">
                  <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="sm" />
                  <PresenceDot status={group.hostPresenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{group.hostName}</p>
                    <span className="shrink-0 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                      團主
                    </span>
                  </div>
                  <p className="text-xs text-ink-3">{group.createdAt} 建立</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`私訊${group.hostName}`}
                  onClick={() => {
                    setActivePanel(null)
                    onClose()
                    window.dispatchEvent(new CustomEvent('pm:open-dm', {
                      detail: { hostId: group.hostId, hostName: group.hostName, hostAvatarInitial: group.hostAvatarInitial, hostAvatarColor: group.hostAvatarColor },
                    }))
                  }}
                  className="text-ink-3 hover:text-brand"
                >
                  <MessageCircle strokeWidth={1.5} size={20} />
                </Button>
              </div>
            </div>
            {members.filter(m => m.userId !== currentUser?.id).map(m => (
              <div key={m.id} className="rounded-lg border border-line p-3">
                <div className="flex items-center gap-3">
                  <span className="relative inline-block shrink-0">
                    <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                    <PresenceDot status={m.userPresenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{m.userName}</p>
                    <p className="text-xs text-ink-3">
                      {m.joinedAt} 加入
                      {showsProfileName && m.serviceInfo?.memberProfileName && (
                        <> ・使用 Profile：{m.serviceInfo.memberProfileName}</>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`私訊${m.userName}`}
                    onClick={() => {
                      setActivePanel(null)
                      onClose()
                      window.dispatchEvent(new CustomEvent('pm:open-dm', {
                        detail: { hostId: m.userId, hostName: m.userName, hostAvatarInitial: m.userAvatarInitial, hostAvatarColor: m.userAvatarColor },
                      }))
                    }}
                    className="text-ink-3 hover:text-brand"
                  >
                    <MessageCircle strokeWidth={1.5} size={20} />
                  </Button>
                </div>
              </div>
            ))}
            {myMember && (
              <div className="rounded-lg border border-line p-3">
                <div className="flex items-center gap-3">
                  <span className="relative inline-block shrink-0">
                    <Avatar initial={myMember.userAvatarInitial} color={myMember.userAvatarColor} size="sm" />
                    <PresenceDot status={myMember.userPresenceStatus} className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {myMember.userName}
                      <span className="ml-1.5 text-xs font-normal text-brand">（你）</span>
                    </p>
                    <p className="text-xs text-ink-3">
                      {myMember.joinedAt} 加入
                      {showsProfileName && myMember.serviceInfo?.memberProfileName && (
                        <> ・使用 Profile：{myMember.serviceInfo.memberProfileName}</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ),
      }
    }

    if (activePanel === 'payments') return buildPaymentsPanel({ group, member: myMember, transactions, transactionsLoading })
    if (activePanel === 'credentials') {
      return buildCredentialsPanel({
        group,
        viewerName: myMember?.userName,
        viewerAvatarInitial: myMember?.userAvatarInitial,
        viewerAvatarColor: myMember?.userAvatarColor,
        viewerPresenceStatus: myMember?.userPresenceStatus,
        showPassword,
        onTogglePassword: () => setShowPassword(v => !v),
        issueNote: myMember?.serviceInfoIssueNote,
        evidenceUrl: myMember?.disputeEvidenceUrl ?? myMember?.serviceInfoIssueEvidenceUrl,
        memberProfiles: showsProfileName
          ? members.map(m => ({
            id: m.id,
            userName: m.userName,
            userAvatarInitial: m.userAvatarInitial,
            userAvatarColor: m.userAvatarColor,
            userPresenceStatus: m.userPresenceStatus,
            profileName: m.serviceInfo?.memberProfileName ?? null,
            isSelf: m.userId === currentUser?.id,
          }))
          : [],
      })
    }

    return null
  }

  return (
    <>

      {!showFillInfo && !showDispute && !confirmDialog && (
      <GroupModalShell
        onClose={onClose}
        group={group}
        service={serviceDef}
        plan={planDef}
        hideRecruitBar={group.status !== 'recruiting'}
        headerBanner={
          hasServiceInfoIssue ? (
            <div className="flex items-center justify-center bg-warning-subtle px-6 py-3 text-sm font-extrabold text-warning-text">
              帳號資訊有問題，請點擊「修正帳號資訊」
            </div>
          ) : needsFillInfo ? (
            <div className="flex items-center justify-center gap-2 bg-brand-subtle px-6 py-3 text-sm font-extrabold text-brand">
              <Clock size={15} strokeWidth={1.5} />
              {isSharedCredentials ? '請提取帳號資訊' : '請填寫服務帳號'}
              {group.serviceInfoDeadline && (
                <>，剩餘 <CountdownText deadline={group.serviceInfoDeadline} /></>
              )}
            </div>
          ) : waitingForOthers ? (
            <div className="flex items-center justify-center gap-2 bg-success-subtle px-6 py-3 text-sm font-extrabold text-success-text">
              <CheckCircle2 size={15} strokeWidth={1.5} />
              {isSharedCredentials ? '已提取帳號資訊，等待其他成員完成' : '已填寫服務帳號，等待其他成員完成填寫'}
            </div>
          ) : canConfirm ? (
            <div className="flex items-center justify-center gap-2 bg-info-subtle px-6 py-3 text-sm font-extrabold text-info-text">
              <Clock size={15} strokeWidth={1.5} />
              服務已啟用，請確認是否正常
            </div>
          ) : isDisputeRaiser ? (
            <div className="flex items-center justify-center gap-2 bg-danger-subtle px-6 py-3 text-sm font-extrabold text-danger-text">
              <Clock size={15} strokeWidth={1.5} />
              {disputedBannerText}
            </div>
          ) : undefined
        }
        extraInfoRows={[]}
        centeredCta={fillInfoCta || confirmCta || undefined}
        statusBadgeOverride={
          alreadyConfirmed ? { variant: 'active' } :
          canConfirm && isDisputed ? 'confirming' :
          waitingForOthers ? { variant: 'active', label: isSharedCredentials ? '已提取完成' : '已填寫完成' } :
          group.status === 'recruiting' && !!sub ? 'member_joined' :
          group.status === 'full' ? { variant: 'full', label: '等待鎖定' } :
          group.status === 'pending_confirmation' && isSharedCredentials ? { variant: 'warning', label: '帳號提取中' } :
          undefined
        }
        pendingBadge={
          hasServiceInfoIssue ? '帳號資訊有問題' :
          needsFillInfo       ? (isSharedCredentials ? '請提取帳號資訊' : '請填寫服務帳號以完成加入流程') :
          waitingForOthers    ? '已填寫完成' :
          canConfirm          ? '確認期進行中，請確認服務' :
          isDisputeRaiser     ? disputedBannerText :
          group.status === 'full' && !!sub ? '招募完成，等待團主鎖定群組' :
          group.status === 'recruiting' && !!sub ? '已通過申請，需等待其他人加入' :
          undefined
        }
        pendingBadgeColor={
          (group.status === 'full' && !!sub) ? 'gray' :
          (group.status === 'recruiting' && !!sub) ? 'success' :
          hasServiceInfoIssue ? 'danger' :
          waitingForOthers ? 'success' :
          canConfirm ? 'brand' :
          isDisputeRaiser ? 'danger' :
          undefined
        }
        sideBar={
          <>
            <GroupModalSideBarItem active={activePanel === null} onClick={() => selectPanel(null)}>
              <Info strokeWidth={1.5} size={17} /> 群組概覽
            </GroupModalSideBarItem>
            <GroupModalSideBarItem active={activePanel === 'members'} onClick={() => selectPanel('members')}>
              <Users strokeWidth={1.5} size={17} /> 群組名單
            </GroupModalSideBarItem>
            {!!sub && (
              <GroupModalSideBarItem active={activePanel === 'payments'} onClick={() => selectPanel('payments')}>
                <Banknote strokeWidth={1.5} size={17} /> 付款管理
              </GroupModalSideBarItem>
            )}
            {canViewCredentials && (
              <GroupModalSideBarItem active={activePanel === 'credentials'} onClick={() => selectPanel('credentials')}>
                <KeyRound strokeWidth={1.5} size={17} /> 帳號資訊
              </GroupModalSideBarItem>
            )}
            {canLeaveGroup && (
              <GroupModalSideBarItem pinned tone="danger" onClick={() => setLeaveConfirm(true)}>
                <LogOut strokeWidth={1.5} size={17} /> 退出群組
              </GroupModalSideBarItem>
            )}
            {isPaymentRelevant && (
              <GroupModalSideBarItem pinned onClick={openMessages}>
                <MessageCircle strokeWidth={1.5} size={17} /> 群組訊息
              </GroupModalSideBarItem>
            )}
          </>
        }
        subPanel={activePanel ? buildSubPanel() : null}
        onSubPanelBack={() => setActivePanel(null)}
        panelKey={activePanel ?? 'overview'}
        mobileReviewsSection={hostReviews}
      >
      </GroupModalShell>
      )}
      <FillServiceInfoModal
        isOpen={showFillInfo}
        onClose={() => setShowFillInfo(false)}
        group={group}
        serviceInfo={myMember?.serviceInfo}
        sharingMethod={serviceDef?.sharingMethod}
        sharingMethodConfig={sharingMethodConfig}
        fillValues={fillValues}
        setFillValues={setFillValues}
        fillValid={fillValid}
        fillLoading={fillLoading}
        onSubmit={handleFillSubmit}
        viewerName={myMember?.userName}
        hasServiceInfoIssue={hasServiceInfoIssue}
        issueNote={myMember?.serviceInfoIssueNote}
      />
      <DisputeModal
        isOpen={showDispute}
        onClose={() => setShowDispute(false)}
        onSubmit={handleDisputeSubmit}
        disputeReasons={disputeReasons}
        onToggleReason={toggleDisputeReason}
        disputeDetail={disputeDetail}
        setDisputeDetail={setDisputeDetail}
        disputeLoading={disputeLoading}
        evidenceUrl={evidence.url}
        evidenceName={evidence.name}
        evidenceUploading={evidence.uploading}
        evidenceProgress={evidence.progress}
        onEvidenceSelect={evidence.onSelect}
        onRemoveEvidence={evidence.onRemove}
      />
      {confirmDialog && (
        <ConfirmServiceModal
          isOpen={confirmDialog}
          onClose={() => { setConfirmDialog(false); setConfirmServiceAgreed(false) }}
          onConfirm={handleConfirmService}
          group={group}
          service={serviceDef}
          plan={planDef}
          confirmed={confirmServiceAgreed}
          setConfirmed={setConfirmServiceAgreed}
          loading={confirmLoading}
          transactions={transactions}
          transactionsLoading={transactionsLoading}
        />
      )}
      {leaveConfirm && (
        <ConfirmActionDialog
          title="退出群組"
          message={`確定要退出「${group.serviceName}」群組嗎？退出後名額將釋出，且需等待 3 分鐘後才能重新提出申請。`}
          confirmLabel="退出"
          danger
          onConfirm={() => { setLeaveConfirm(false); onLeaveGroup?.() }}
          onCancel={() => setLeaveConfirm(false)}
        />
      )}
      {reviewPrompt && (
        <ReviewUserModal
          target={{
            name: group.hostName,
            avatarInitial: group.hostAvatarInitial,
            avatarColor: group.hostAvatarColor,
            presenceStatus: group.hostPresenceStatus,
          }}
          subtitle={`${group.serviceName} · ${group.planName}`}
          onSubmit={({ rating, comment }) => submitReview({ groupId: group.id, revieweeId: group.hostId, rating, comment })}
          onClose={() => { const { closeOnDone } = reviewPrompt; setReviewPrompt(null); if (closeOnDone) onClose() }}
        />
      )}
    </>
  );
}
