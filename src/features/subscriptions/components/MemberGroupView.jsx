import { useState } from 'react'
import {
  CheckCircle2, LogOut, MessageCircle, Shield, Users, ClipboardEdit, ThumbsUp, AlertTriangle,
} from 'lucide-react'
import Avatar from '../../../shared/ui/Avatar'
import CountdownConfirmDialog from '../../../shared/ui/CountdownConfirmDialog'
import GroupModalShell from '../../../shared/ui/GroupModalShell'
import { getServiceById } from '../../../shared/utils/serviceUtils'
import { useMemberStore } from '../../../shared/stores/useMemberStore'
import { useGroupStore } from '../../../shared/stores/useGroupStore'
import { useSubscriptionStore } from '../../../shared/stores/useSubscriptionStore'
import { useAuthStore } from '../../../shared/stores/useAuthStore'
import { toast } from '../../../shared/utils/toast'

export default function MemberGroupView({ group, onLeaveGroup, onClose }) {
  const [activePanel, setActivePanel] = useState(null) // 'members' | 'fillInfo' | null
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [fillEmail, setFillEmail] = useState('')
  const [fillLoading, setFillLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeLoading, setDisputeLoading] = useState(false)

  const currentUser = useAuthStore(s => s.user)
  const allMembers  = useMemberStore(s => s.members)
  const subscriptions = useSubscriptionStore(s => s.subscriptions)
  const fillServiceInfo = useMemberStore(s => s.fillServiceInfo)
  const confirmService  = useGroupStore(s => s.confirmService)
  const disputeGroup    = useGroupStore(s => s.disputeGroup)
  const members     = allMembers.filter(m => m.groupId === group.id)
  const sub         = currentUser ? (subscriptions.find(s => s.userId === currentUser.id && s.groupId === group.id) ?? null) : null
  const myMember    = currentUser ? members.find(m => m.userId === currentUser.id) ?? null : null

  const serviceDef        = getServiceById(group.serviceId)
  const planDef           = serviceDef?.plans.find(p => p.name === group.planName)
  const isPaymentRelevant = !['recruiting', 'full'].includes(group.status)

  const hasServiceInfoIssue = !!myMember?.serviceInfoIssueNote
  const hasServiceInfo      = !!myMember?.serviceInfo?.email && !hasServiceInfoIssue
  const needsFillInfo       = !!sub && isPaymentRelevant && !hasServiceInfo && group.status === 'pending_confirmation'
  const canLeaveGroup       = ['recruiting', 'full'].includes(group.status) && !!myMember
  const canConfirm          = group.status === 'confirming' && !!myMember && !myMember.confirmedAt
  const alreadyConfirmed    = group.status === 'confirming' && !!myMember?.confirmedAt
  const canDispute          = group.status === 'confirming' && !!myMember && !myMember.confirmedAt
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
        toast('確認完成，款項已撥付給團主！', 'success')
        onClose()
      } else {
        toast('已確認，等待其他成員確認中', 'success')
      }
    } catch (err) {
      toast(err?.message ?? '確認失敗，請稍後再試', 'error')
    } finally {
      setConfirmLoading(false)
    }
  }

  async function handleDisputeSubmit(e) {
    e.preventDefault()
    if (!disputeReason.trim()) return
    setDisputeLoading(true)
    try {
      await disputeGroup(group.id, { reason: disputeReason.trim() })
      setActivePanel(null)
      setDisputeReason('')
      toast('申訴已送出，客服將在 3 天內裁定', 'success')
      onClose()
    } catch (err) {
      toast(err?.message ?? '申訴失敗，請稍後再試', 'error')
    } finally {
      setDisputeLoading(false)
    }
  }

  async function handleFillSubmit(e) {
    e.preventDefault()
    if (!fillEmail.trim() || !myMember) return
    setFillLoading(true)
    try {
      await fillServiceInfo(myMember.id, group.id, { email: fillEmail.trim() })
      setActivePanel(null)
      toast('帳號資訊已送出', 'success')
    } catch (err) {
      toast(err?.message ?? '送出失敗，請稍後再試', 'error')
    } finally {
      setFillLoading(false)
    }
  }

  function buildSubPanel() {
    if (activePanel === 'dispute') {
      return {
        title: '向平台申訴',
        icon: <AlertTriangle size={18} className="text-danger" />,
        content: (
          <form onSubmit={handleDisputeSubmit} className="p-5 space-y-4">
            <div className="rounded-lg bg-warning-subtle px-3 py-2.5 text-sm text-warning-text">
              <p className="font-semibold mb-1">申訴須知</p>
              <p>申訴後群組進入申訴期，代管金額凍結，客服將在 3 天內裁定。請詳細說明問題。</p>
            </div>
            <div>
              <label className="block text-xs text-ink-3 mb-1.5">申訴原因 <span className="text-danger">*</span></label>
              <textarea
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                placeholder="請描述服務未正常啟用的具體情況..."
                rows={4}
                required
                className="w-full rounded-xl border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={!disputeReason.trim() || disputeLoading}
              className="w-full rounded-xl bg-danger py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none"
            >
              {disputeLoading ? '送出中…' : '送出申訴'}
            </button>
          </form>
        ),
      }
    }

    if (activePanel === 'fillInfo') {
      const existingEmail = myMember?.serviceInfo?.email ?? ''
      return {
        title: '填寫服務帳號',
        icon: <ClipboardEdit size={18} className="text-brand" />,
        content: (
          <form onSubmit={handleFillSubmit} className="p-5 space-y-4">
            <p className="text-sm text-ink-3">
              請填寫你用於 <span className="font-semibold text-ink">{group.serviceName}</span> 的帳號電子信箱，團主將使用此資訊幫你設定訂閱。
            </p>
            {existingEmail && (
              <div className="rounded-lg bg-success-subtle px-3 py-2 text-sm text-success-text flex items-center gap-2">
                <CheckCircle2 size={14} /> 目前已填：{existingEmail}
              </div>
            )}
            <div>
              <label className="block text-xs text-ink-3 mb-1.5">帳號電子信箱</label>
              <input
                type="email"
                value={fillEmail}
                onChange={e => setFillEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
                className="w-full rounded-xl border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <button
              type="submit"
              disabled={!fillEmail.trim() || fillLoading}
              className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-40 disabled:pointer-events-none"
            >
              {fillLoading ? '送出中…' : '送出帳號資訊'}
            </button>
          </form>
        ),
      }
    }

    if (activePanel === 'members') {
      return {
        title: '成員名單',
        icon: <Users size={18} className="text-brand" />,
        content: (
          <div className="p-5 space-y-2">
            <div className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-3">
                <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{group.hostName}</p>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                      <Shield size={11} /> 團主
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

    return null
  }

  return (
    <>
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
          <div className="flex items-center justify-center bg-brand-subtle px-6 py-3 text-sm font-extrabold text-brand">
            請填寫服務帳號以完成加入流程
          </div>
        ) : canConfirm ? (
          <div className="flex items-center justify-center bg-info-subtle px-6 py-3 text-sm font-extrabold text-info-text">
            服務已啟用，請在 48 小時內確認是否正常
          </div>
        ) : alreadyConfirmed ? (
          <div className="flex items-center justify-center bg-success-subtle px-6 py-3 text-sm font-extrabold text-success-text">
            你已確認，等待其他成員或確認期結束
          </div>
        ) : isDisputed ? (
          <div className="flex items-center justify-center bg-danger-subtle px-6 py-3 text-sm font-extrabold text-danger-text">
            申訴進行中，客服將在 3 天內裁定
          </div>
        ) : undefined
      }
      extraInfoRows={[]}
      statusBadgeOverride={group.status === 'recruiting' && !!sub ? 'member_joined' : undefined}
      pendingBadge={
        hasServiceInfoIssue ? '服務帳號需要修正' :
        needsFillInfo       ? '請填寫服務帳號以完成加入流程' :
        canConfirm          ? '確認期進行中，請確認服務' :
        alreadyConfirmed    ? '已確認，等待確認期結束' :
        isDisputed          ? '申訴進行中' :
        group.status === 'full' && !!sub ? '招募完成，等待團主啟用群組' :
        group.status === 'recruiting' && !!sub ? '已通過申請，需等待其他人加入' :
        undefined
      }
      pendingBadgeColor={
        (['recruiting', 'full'].includes(group.status) && !!sub) ? 'success' :
        hasServiceInfoIssue ? 'danger' :
        canConfirm ? 'brand' :
        alreadyConfirmed ? 'success' :
        isDisputed ? 'danger' :
        undefined
      }
      bottomBar={(() => {
        const showFillBtn = needsFillInfo || hasServiceInfoIssue
        const btnCount = 1 + (isPaymentRelevant ? 1 : 0) + (showFillBtn ? 1 : 0) + (canConfirm ? 1 : 0) + (canDispute ? 1 : 0) + (canLeaveGroup ? 1 : 0)
        return (
          <div className={`grid grid-cols-${btnCount} gap-1 p-2`}>
            <button
              onClick={() => setActivePanel('members')}
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
            >
              <Users size={17} /> 成員名單
            </button>
            {showFillBtn && (
              <button
                onClick={() => { setFillEmail(myMember?.serviceInfo?.email ?? ''); setActivePanel('fillInfo') }}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand-subtle"
              >
                <ClipboardEdit size={17} /> 填寫帳號
              </button>
            )}
            {canConfirm && (
              <button
                onClick={() => setConfirmDialog(true)}
                disabled={confirmLoading}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-success-text transition-colors hover:bg-success-subtle disabled:opacity-40"
              >
                <ThumbsUp size={17} /> 確認服務
              </button>
            )}
            {canDispute && (
              <button
                onClick={() => { setDisputeReason(''); setActivePanel('dispute') }}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger-subtle"
              >
                <AlertTriangle size={17} /> 申訴
              </button>
            )}
            {isPaymentRelevant && (
              <button
                onClick={openMessages}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
              >
                <MessageCircle size={17} /> 群組訊息
              </button>
            )}
            {canLeaveGroup && (
              <button
                onClick={() => setLeaveConfirm(true)}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-danger transition-colors hover:bg-red-50"
              >
                <LogOut size={17} /> 退出群組
              </button>
            )}
          </div>
        )
      })()}
      subPanel={activePanel ? buildSubPanel() : null}
      onSubPanelBack={() => setActivePanel(null)}
    >
    </GroupModalShell>

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

  </>
  )
}
