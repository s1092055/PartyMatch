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
import HostReviews from '../../group/components/HostReviews'
import ReviewHostModal from './ReviewHostModal'
import FillServiceInfoModal from './FillServiceInfoModal'
import DisputeModal from './DisputeModal'
import { buildPaymentsPanel } from './memberGroupView/buildPaymentsPanel'
import { buildCredentialsPanel } from './memberGroupView/buildCredentialsPanel'
import { getServiceById } from '../../../common/utils/serviceUtils'
import { getSharingMethodConfig, hasFilledServiceInfo, isSharedCredentialsMethod } from '../../../common/utils/serviceInfoFields'
import { useMemberStore } from '../../../common/stores/useMemberStore'
import { useGroupStore } from '../../../common/stores/useGroupStore'
import { useSubscriptionStore } from '../../../common/stores/useSubscriptionStore'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { useReviewStore } from '../../../common/stores/useReviewStore'
import { uploadDisputeEvidence } from '../../../common/api/storageApi'
import { fetchGroupTokenTransactions } from '../../../common/api/tokensApi'
import { toast } from '../../../common/utils/toast'
import { useEvidenceUpload } from '../../../common/utils/hooks'
import { isEffectivelyActive } from '../../../common/utils/groupStatus'

export default function MemberGroupView({ group, onLeaveGroup, onClose, autoOpenCredentials }) {
  const [activePanel, setActivePanel] = useState(null) // 'members' | 'payments' | 'credentials' | null
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [showFillInfo, setShowFillInfo] = useState(false)
  const [showDispute, setShowDispute] = useState(false)
  const [fillValues, setFillValues] = useState({})
  const [fillLoading, setFillLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [confirmServiceAgreed, setConfirmServiceAgreed] = useState(false)
  const [confirmProfileName, setConfirmProfileName] = useState('')
  const [disputeReasons, setDisputeReasons] = useState([])
  const [disputeDetail, setDisputeDetail] = useState('')
  const [disputeLoading, setDisputeLoading] = useState(false)
  const evidence = useEvidenceUpload(uploadDisputeEvidence)
  const [reviewPrompt, setReviewPrompt] = useState(null) // null | { closeOnDone: boolean }
  const [transactions, setTransactions] = useState([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [extractLoading, setExtractLoading] = useState(false)

  // 通知中心的「請提取帳號資訊」點進來要直接落在這個分頁，不能只是打開群組詳情、
  // 讓使用者自己找側邊欄——見 FloatingMessages.jsx 的 fill_service_info 處理
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenCredentials) setActivePanel('credentials')
  }, [autoOpenCredentials])

  useEffect(() => {
    if (activePanel !== 'payments') return
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
  }, [activePanel, group.id])

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
  const isPaymentRelevant = !['recruiting', 'full'].includes(group.status)

  const sharingMethodConfig = getSharingMethodConfig(serviceDef?.sharingMethod)
  // 團主主動提供帳密的服務（shared_credentials）成員端不需要「填寫」任何東西，只有一個確認框，
  // 文案要跟其他 5 種要成員自己填 Email／邀請碼的方式區分開來，避免讓人誤以為要自己輸入帳密
  const isSharedCredentials = isSharedCredentialsMethod(serviceDef?.sharingMethod)
  // 團主提供帳密的服務，鎖定後不管填寫進度如何都要讓成員隨時能回來查看帳密（忘記密碼時），
  // 不能只在「尚未提取」的當下才給入口——跟其他要成員自行輸入的共享機制不同，資訊有效期是整個訂閱週期
  const canViewCredentials  = isSharedCredentials && isPaymentRelevant
  // serviceInfoIssueNote 這個欄位被團主標記「帳號需修正」跟申訴理由共用，
  // 送出申訴後自己的 serviceInfoIssueNote 也會被寫入申訴理由，此時要顯示的是「問題處理中」而不是「帳號需修正」
  const hasServiceInfoIssue = !!myMember?.serviceInfoIssueNote && group.status !== 'disputed'
  const hasServiceInfo      = hasFilledServiceInfo(myMember?.serviceInfo, serviceDef?.sharingMethod) && !hasServiceInfoIssue
  const needsFillInfo       = !!sub && isPaymentRelevant && !hasServiceInfo && group.status === 'pending_confirmation'
  // 已經填完但其他成員還沒填完時，畫面不能什麼都不顯示，不然會讓人誤以為自己還沒填寫
  const waitingForOthers    = !!sub && hasServiceInfo && group.status === 'pending_confirmation'
  const canLeaveGroup       = ['recruiting', 'full'].includes(group.status) && !!myMember
  const canConfirm          = group.status === 'confirming' && !!myMember && !myMember.confirmedAt
  const alreadyConfirmed    = group.status === 'confirming' && isEffectivelyActive(group.status, myMember?.confirmedAt)
  const isDisputed          = group.status === 'disputed'
  // disputed 狀態下只有申訴發起人自己的 serviceInfoIssueNote 會被填入申訴理由，藉此跟其他無關成員區分文案
  const isDisputeRaiser     = isDisputed && !!myMember?.serviceInfoIssueNote
  const disputedBannerText  = isDisputeRaiser ? '回報處理中' : '群組進度暫停中'

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
    <HostReviews
      group={group}
      headerClassName="text-lg font-black text-brand"
      onDm={openDmWithHost}
      scrollable
    />
  )

  async function handleConfirmService() {
    setConfirmLoading(true)
    try {
      // 共用帳密的服務要先把成員自己填的 Profile 名稱存進 serviceInfo，再送出確認；
      // 沿用 fillServiceInfo 既有的 PATCH /members/:id，不用另外開新的 API
      if (isSharedCredentials && myMember) {
        await fillServiceInfo(myMember.id, group.id, { ...myMember.serviceInfo, memberProfileName: confirmProfileName.trim() })
      }
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

  // 開啟回報表單、或送出成功後都要恢復成一片空白，兩處共用同一個 reset
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

  // 團主提供帳密的服務不用走 FillServiceInfoModal 那套「填寫表單」，直接在帳號資訊分頁
  // 按下按鈕就等同確認取得，payload 固定是 sharingMethodConfig 裡唯一的 checkbox 欄位
  async function handleExtractCredentials() {
    if (!myMember || extractLoading) return
    setExtractLoading(true)
    try {
      await fillServiceInfo(myMember.id, group.id, { acknowledged: true })
      toast('已提取帳號資訊', 'success')
    } catch (err) {
      toast(err?.message ?? '提取失敗，請稍後再試', 'error')
    } finally {
      setExtractLoading(false)
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

  // 團主提供帳密的服務改成在帳號資訊分頁裡按按鈕提取（見下方 buildCredentialsPanel），
  // 這裡的 CTA 不用再重複開一個 sub-modal；帳號被團主標記需要修正時則不分服務類型，
  // 都還是走這顆按鈕重新打開 FillServiceInfoModal 確認/修正
  const fillInfoCta = ((needsFillInfo && !isSharedCredentials) || hasServiceInfoIssue) && (
    <div className="py-2">
      <Button
        onClick={() => { setFillValues(myMember?.serviceInfo ?? {}); setShowFillInfo(true) }}
        className="w-full rounded-lg shadow-md"
      >
        <ClipboardEdit size={15} /> {isSharedCredentials ? '提取帳號資訊' : '填寫帳號'}
      </Button>
    </div>
  )

  const confirmCta = canConfirm && (
    <div className="grid grid-cols-2 gap-2 p-2">
      <Button
        onClick={() => { setConfirmProfileName(myMember?.serviceInfo?.memberProfileName ?? ''); setConfirmDialog(true) }}
        disabled={confirmLoading}
        className="rounded-lg shadow-md"
      >
        <CheckCircle2 size={15} /> 確認服務
      </Button>
      <Button
        variant="destructive"
        onClick={() => { resetDisputeForm(); setShowDispute(true) }}
        className="rounded-lg shadow-md"
      >
        <AlertTriangle size={14} /> 回報問題
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
                  <MessageCircle size={20} />
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
                    <p className="text-xs text-ink-3">{m.joinedAt} 加入</p>
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
                    <MessageCircle size={20} />
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
                    <p className="text-xs text-ink-3">{myMember.joinedAt} 加入</p>
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
        hasServiceInfo,
        onExtract: handleExtractCredentials,
        extractLoading,
      })
    }

    return null
  }

  return (
    <>
    {/* 填寫服務帳號／回報問題／確認服務正常這三個 sub-modal 開啟時，完全隱藏底下的群組詳情 modal，
        不是疊加半透明遮罩；確認服務正常改成跟團主端 ActivateServiceModal 同一套完整排版後，
        也要比照辦理，不然兩層 Dialog 的背景遮罩會疊在一起；關閉 sub-modal 才重新顯示群組詳情，
        狀態（activePanel 等）都留在這個元件裡，不會重置 */}
    {!showFillInfo && !showDispute && !confirmDialog && (
    <GroupModalShell
      onClose={onClose}
      group={group}
      service={serviceDef}
      plan={planDef}
      hideRecruitBar
      headerBanner={
        hasServiceInfoIssue ? (
          <div className="flex items-center justify-center bg-warning-subtle px-6 py-3 text-sm font-extrabold text-warning-text">
            服務帳號有問題，需要修正
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
            {group.confirmDeadline && (
              <>，剩餘 <CountdownText deadline={group.confirmDeadline} /></>
            )}
          </div>
        ) : isDisputed ? (
          <div className="flex items-center justify-center gap-2 bg-danger-subtle px-6 py-3 text-sm font-extrabold text-danger-text">
            <Clock size={15} strokeWidth={1.5} />
            {disputedBannerText}
            {group.disputeDeadline && (
              <>，剩餘 <CountdownText deadline={group.disputeDeadline} /></>
            )}
          </div>
        ) : undefined
      }
      extraInfoRows={[]}
      centeredCta={fillInfoCta || confirmCta || undefined}
      statusBadgeOverride={
        alreadyConfirmed ? { variant: 'active' } :
        waitingForOthers ? { variant: 'active', label: isSharedCredentials ? '已提取完成' : '已填寫完成' } :
        group.status === 'recruiting' && !!sub ? 'member_joined' :
        group.status === 'full' ? { variant: 'full', label: '等待鎖定' } :
        group.status === 'pending_confirmation' && isSharedCredentials ? { variant: 'warning', label: '帳號提取中' } :
        undefined
      }
      pendingBadge={
        hasServiceInfoIssue ? '服務帳號需要修正' :
        needsFillInfo       ? (isSharedCredentials ? '請提取帳號資訊' : '請填寫服務帳號以完成加入流程') :
        waitingForOthers    ? '已填寫完成' :
        canConfirm          ? '確認期進行中，請確認服務' :
        isDisputed          ? disputedBannerText :
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
        isDisputed ? 'danger' :
        undefined
      }
      sideBar={
        <>
          <GroupModalSideBarItem active={activePanel === null} onClick={() => setActivePanel(null)}>
            <Info size={17} /> 群組概覽
          </GroupModalSideBarItem>
          <GroupModalSideBarItem active={activePanel === 'members'} onClick={() => setActivePanel('members')}>
            <Users size={17} /> 群組名單
          </GroupModalSideBarItem>
          {!!sub && (
            <GroupModalSideBarItem active={activePanel === 'payments'} onClick={() => setActivePanel('payments')}>
              <Banknote size={17} /> 付款管理
            </GroupModalSideBarItem>
          )}
          {canViewCredentials && (
            <GroupModalSideBarItem active={activePanel === 'credentials'} onClick={() => setActivePanel('credentials')}>
              <KeyRound size={17} /> 帳號資訊
            </GroupModalSideBarItem>
          )}
          {canLeaveGroup && (
            <GroupModalSideBarItem pinned tone="danger" onClick={() => setLeaveConfirm(true)}>
              <LogOut size={17} /> 退出群組
            </GroupModalSideBarItem>
          )}
          {isPaymentRelevant && (
            <GroupModalSideBarItem pinned onClick={openMessages}>
              <MessageCircle size={17} /> 群組訊息
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
        sharingMethod={serviceDef?.sharingMethod}
        profileName={confirmProfileName}
        setProfileName={setConfirmProfileName}
        confirmed={confirmServiceAgreed}
        setConfirmed={setConfirmServiceAgreed}
        loading={confirmLoading}
      />
    )}

    {leaveConfirm && (
      <ConfirmActionDialog
        title="退出群組"
        message={`確定要退出「${group.serviceName}」群組嗎？退出後名額將釋出，若要再加入需要重新提出申請。`}
        confirmLabel="退出"
        danger
        onConfirm={() => { setLeaveConfirm(false); onLeaveGroup?.() }}
        onCancel={() => setLeaveConfirm(false)}
      />
    )}

    {reviewPrompt && (
      <ReviewHostModal
        group={group}
        onSubmit={({ rating, comment }) => submitReview({ groupId: group.id, hostId: group.hostId, rating, comment })}
        onClose={() => { const { closeOnDone } = reviewPrompt; setReviewPrompt(null); if (closeOnDone) onClose() }}
      />
    )}

  </>
  )
}
