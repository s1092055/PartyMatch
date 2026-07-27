import { useEffect, useState } from 'react'
import {
  Banknote, CheckCircle2, Clock, Paperclip, FileText, Info, LogOut, MessageCircle, Users, ClipboardEdit, ThumbsUp, AlertTriangle, X,
} from 'lucide-react'
import Avatar from '../../../../shared/ui/primitives/Avatar'
import CountdownConfirmDialog from '../../../../shared/ui/primitives/CountdownConfirmDialog'
import CountdownText from '../../../../shared/ui/primitives/CountdownText'
import GroupModalShell from '../../../../shared/ui/group/GroupModalShell'
import GroupModalSideBarItem from '../../../../shared/ui/group/GroupModalSideBarItem'
import ReviewHostModal from './ReviewHostModal'
import FillServiceInfoModal from './FillServiceInfoModal'
import { buildPaymentsPanel } from './memberGroupView/buildPaymentsPanel'
import { getServiceById } from '../../../../shared/utils/serviceUtils'
import { getSharingMethodConfig, hasFilledServiceInfo } from '../../../../shared/utils/serviceInfoFields'
import { useMemberStore } from '../../../../shared/stores/useMemberStore'
import { useGroupStore } from '../../../../shared/stores/useGroupStore'
import { useSubscriptionStore } from '../../../../shared/stores/useSubscriptionStore'
import { useAuthStore } from '../../../../shared/stores/useAuthStore'
import { useReviewStore } from '../../../../shared/stores/useReviewStore'
import { uploadDisputeEvidence } from '../../../../shared/api/storageApi'
import { fetchGroupTokenTransactions } from '../../../../shared/api/tokensApi'
import { toast } from '../../../../shared/utils/toast'
import { isEffectivelyActive } from '../../../../shared/utils/groupStatus'

const DISPUTE_REASON_OPTIONS = [
  '服務帳號未提供或有誤',
  '服務尚未啟用',
  '服務品質與描述不符',
  '團主已讀不回、無法聯繫',
  '帳號被團主收回或更改密碼',
  '其他',
]

function isImageUrl(url) {
  return /\.(png|jpe?g|gif|webp|heic)(\?|$)/i.test(url)
}

export default function MemberGroupView({ group, onLeaveGroup, onClose }) {
  const [activePanel, setActivePanel] = useState(null) // 'members' | 'payments' | 'dispute' | null
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [showFillInfo, setShowFillInfo] = useState(false)
  const [fillValues, setFillValues] = useState({})
  const [fillLoading, setFillLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [disputeReasons, setDisputeReasons] = useState([])
  const [disputeDetail, setDisputeDetail] = useState('')
  const [disputeLoading, setDisputeLoading] = useState(false)
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [evidenceName, setEvidenceName] = useState('')
  const [evidenceUploading, setEvidenceUploading] = useState(false)
  const [reviewPrompt, setReviewPrompt] = useState(null) // null | { closeOnDone: boolean }
  const [transactions, setTransactions] = useState([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)

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
  const hasServiceInfoIssue = !!myMember?.serviceInfoIssueNote
  const hasServiceInfo      = hasFilledServiceInfo(myMember?.serviceInfo, serviceDef?.sharingMethod) && !hasServiceInfoIssue
  const needsFillInfo       = !!sub && isPaymentRelevant && !hasServiceInfo && group.status === 'pending_confirmation'
  // 已經填完但其他成員還沒填完時，畫面不能什麼都不顯示，不然會讓人誤以為自己還沒填寫
  const waitingForOthers    = !!sub && hasServiceInfo && group.status === 'pending_confirmation'
  const canLeaveGroup       = ['recruiting', 'full'].includes(group.status) && !!myMember
  const canConfirm          = group.status === 'confirming' && !!myMember && !myMember.confirmedAt
  const alreadyConfirmed    = group.status === 'confirming' && isEffectivelyActive(group.status, myMember?.confirmedAt)
  const isDisputed          = group.status === 'disputed'

  function openMessages() {
    onClose()
    window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: group.id } }))
  }

  async function handleConfirmService() {
    setConfirmLoading(true)
    try {
      const res = await confirmService(group.id)
      setConfirmDialog(false)
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

  async function handleEvidenceSelect(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setEvidenceUploading(true)
    try {
      const url = await uploadDisputeEvidence(file)
      setEvidenceUrl(url)
      setEvidenceName(file.name)
    } catch (err) {
      toast(err?.message ?? '附件上傳失敗，請稍後再試', 'error')
    } finally {
      setEvidenceUploading(false)
    }
  }

  async function handleDisputeSubmit(e) {
    e.preventDefault()
    if (disputeReasons.length === 0) return
    const reason = [disputeReasons.join('、'), disputeDetail.trim()].filter(Boolean).join('\n')
    setDisputeLoading(true)
    try {
      await disputeGroup(group.id, { reason, evidenceUrl: evidenceUrl || undefined })
      setActivePanel(null)
      setDisputeReasons([])
      setDisputeDetail('')
      setEvidenceUrl('')
      setEvidenceName('')
      toast('申訴已送出，客服將在 3 天內裁定', 'success')
      onClose()
    } catch (err) {
      toast(err?.message ?? '申訴失敗，請稍後再試', 'error')
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

  const fillInfoCta = (needsFillInfo || hasServiceInfoIssue) && (
    <div className="py-2">
      <button
        onClick={() => { setFillValues(myMember?.serviceInfo ?? {}); setShowFillInfo(true) }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-hover"
      >
        <ClipboardEdit size={15} /> 填寫帳號
      </button>
    </div>
  )

  const confirmCta = canConfirm && (
    <div className="grid grid-cols-2 gap-2 p-2">
      <button
        onClick={() => setConfirmDialog(true)}
        disabled={confirmLoading}
        className="flex items-center justify-center gap-2 rounded-xl bg-success px-6 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-success-text disabled:opacity-60"
      >
        <ThumbsUp size={15} /> 確認服務
      </button>
      <button
        onClick={() => { setDisputeReasons([]); setDisputeDetail(''); setEvidenceUrl(''); setEvidenceName(''); setActivePanel('dispute') }}
        className="flex items-center justify-center gap-2 rounded-xl border border-danger px-5 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger-subtle"
      >
        <AlertTriangle size={14} /> 回報問題
      </button>
    </div>
  )

  function buildSubPanel() {
    if (activePanel === 'dispute') {
      return {
        // 申訴不像群組名單/填寫帳號在側邊欄有對應按鈕可高亮標示目前位置，保留標題讓使用者知道自己在哪個畫面
        title: '向平台申訴',
        icon: <AlertTriangle size={18} className="text-danger" />,
        content: (
          <form onSubmit={handleDisputeSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs text-ink-3 mb-1.5">申訴原因 <span className="text-danger">*</span>（可複選）</label>
              <div className="space-y-1.5">
                {DISPUTE_REASON_OPTIONS.map(option => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3 py-2 text-sm text-ink-2 transition-colors hover:border-brand/40"
                  >
                    <input
                      type="checkbox"
                      checked={disputeReasons.includes(option)}
                      onChange={() => toggleDisputeReason(option)}
                      className="h-4 w-4 shrink-0 accent-danger"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-ink-3 mb-1.5">補充說明（選填）</label>
              <textarea
                value={disputeDetail}
                onChange={e => setDisputeDetail(e.target.value)}
                placeholder="請描述服務未正常啟用的具體情況..."
                rows={4}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-3 mb-1.5">附件說明（選填）</label>
              {evidenceUrl ? (
                <div className="flex w-full items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                  {isImageUrl(evidenceUrl) ? (
                    <img src={evidenceUrl} alt={evidenceName} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <FileText size={20} className="shrink-0 text-ink-3" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-2">{evidenceName || '附件'}</span>
                  <button
                    type="button"
                    onClick={() => { setEvidenceUrl(''); setEvidenceName('') }}
                    aria-label="移除附件"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-4 transition-colors hover:bg-raised hover:text-ink-2"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-medium text-ink-3 transition-colors hover:border-brand/40 hover:text-brand">
                  <input type="file" onChange={handleEvidenceSelect} className="hidden" disabled={evidenceUploading} />
                  <Paperclip size={16} />
                  {evidenceUploading ? '上傳中…' : '新增附件'}
                </label>
              )}
            </div>
            <div className="rounded-lg bg-warning-subtle px-3 py-2.5 text-sm text-warning-text">
              <p className="font-semibold mb-1">申訴須知</p>
              <p>申訴後群組進入申訴期，代管金額凍結，客服將在 3 天內裁定。請詳細說明問題。</p>
            </div>
            <button
              type="submit"
              disabled={disputeReasons.length === 0 || disputeLoading || evidenceUploading}
              className="w-full rounded-xl bg-danger py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none"
            >
              {disputeLoading ? '送出中…' : '送出申訴'}
            </button>
          </form>
        ),
      }
    }

    if (activePanel === 'members') {
      return {
        content: (
          <div className="p-5 space-y-2">
            <div className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-3">
                <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{group.hostName}</p>
                    <span className="shrink-0 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                      團主
                    </span>
                  </div>
                  <p className="text-xs text-ink-3">{group.createdAt} 建立</p>
                </div>
                <button
                  onClick={() => {
                    setActivePanel(null)
                    onClose()
                    window.dispatchEvent(new CustomEvent('pm:open-dm', {
                      detail: { hostId: group.hostId, hostName: group.hostName, hostAvatarInitial: group.hostAvatarInitial, hostAvatarColor: group.hostAvatarColor },
                    }))
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-brand"
                >
                  <MessageCircle size={20} />
                </button>
              </div>
            </div>
            {members.filter(m => m.userId !== currentUser?.id).map(m => (
              <div key={m.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-3">
                  <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{m.userName}</p>
                    <p className="text-xs text-ink-3">{m.joinedAt} 加入</p>
                  </div>
                  <button
                    onClick={() => {
                      setActivePanel(null)
                      onClose()
                      window.dispatchEvent(new CustomEvent('pm:open-dm', {
                        detail: { hostId: m.userId, hostName: m.userName, hostAvatarInitial: m.userAvatarInitial, hostAvatarColor: m.userAvatarColor },
                      }))
                    }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-brand"
                  >
                    <MessageCircle size={20} />
                  </button>
                </div>
              </div>
            ))}
            {myMember && (
              <div className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-3">
                  <Avatar initial={myMember.userAvatarInitial} color={myMember.userAvatarColor} size="sm" />
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

    return null
  }

  return (
    <>
    {/* 填寫服務帳號 sub-modal 開啟時，完全隱藏底下的群組詳情 modal，不是疊加半透明遮罩；
        關閉 sub-modal 才重新顯示群組詳情，狀態（activePanel 等）都留在這個元件裡，不會重置 */}
    {!showFillInfo && (
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
            請填寫服務帳號以完成加入流程
            {group.serviceInfoDeadline && (
              <>，剩餘 <CountdownText deadline={group.serviceInfoDeadline} /></>
            )}
          </div>
        ) : waitingForOthers ? (
          <div className="flex items-center justify-center gap-2 bg-success-subtle px-6 py-3 text-sm font-extrabold text-success-text">
            <CheckCircle2 size={15} strokeWidth={1.5} />
            已填寫服務帳號，等待其他成員完成填寫
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
          <div className="flex items-center justify-center bg-danger-subtle px-6 py-3 text-sm font-extrabold text-danger-text">
            申訴進行中，客服將在 3 天內裁定
          </div>
        ) : undefined
      }
      extraInfoRows={[]}
      centeredCta={fillInfoCta || confirmCta || undefined}
      statusBadgeOverride={
        alreadyConfirmed ? { variant: 'active' } :
        waitingForOthers ? { variant: 'active', label: '已填寫完成' } :
        group.status === 'recruiting' && !!sub ? 'member_joined' :
        undefined
      }
      pendingBadge={
        hasServiceInfoIssue ? '服務帳號需要修正' :
        needsFillInfo       ? '請填寫服務帳號以完成加入流程' :
        waitingForOthers    ? '已填寫完成' :
        canConfirm          ? '確認期進行中，請確認服務' :
        isDisputed          ? '申訴進行中' :
        group.status === 'full' && !!sub ? '招募完成，等待團主鎖定群組' :
        group.status === 'recruiting' && !!sub ? '已通過申請，需等待其他人加入' :
        undefined
      }
      pendingBadgeColor={
        (['recruiting', 'full'].includes(group.status) && !!sub) ? 'success' :
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
    />

    {confirmDialog && (
      <CountdownConfirmDialog
        title="確認服務正常"
        message={`確認「${group.serviceName}」服務已正常啟用？確認後款項將立即撥付給團主，此操作無法撤回。`}
        confirmLabel="確認服務正常"
        onConfirm={handleConfirmService}
        onCancel={() => setConfirmDialog(false)}
      />
    )}

    {leaveConfirm && (
      <CountdownConfirmDialog
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
