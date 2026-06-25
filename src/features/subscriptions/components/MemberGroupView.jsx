import { useEffect, useState } from 'react'
import {
  CheckCircle2, ChevronDown, ChevronUp, CreditCard, LogOut, MessageCircle, Receipt, Shield, Users,
} from 'lucide-react'
import CombinedServicePaymentModal from './CombinedServicePaymentModal'
import Avatar from '../../../shared/ui/Avatar'
import ConfirmDialog from '../../../shared/ui/ConfirmDialog'
import GroupModalShell from '../../../shared/ui/GroupModalShell'
import EmptyState from '../../../shared/ui/EmptyState'
import { getServiceById } from '../../../shared/utils/serviceUtils'
import { getMembersByGroupId, updateMember } from '../../../shared/stores/memberStore'
import { getGroupById } from '../../../shared/stores/groupStore'
import { getSubscriptionByUserAndGroup, markSubscriptionPaid } from '../../../shared/stores/subscriptionStore'
import { getPaymentRecordsBySubscriptionId, initPayments } from '../../../shared/stores/paymentStore'
import { createNotification } from '../../../shared/stores/notificationStore'
import { getCurrentUser } from '../../../shared/stores/authStore'
import { sendActionMessage } from '../../../shared/api/messagesApi'
import { todayISO } from '../../../shared/utils/date'

export default function MemberGroupView({ group, onLeaveGroup, onClose, autoOpenPayment }) {
  const [activePanel, setActivePanel]         = useState(null) // 'members' | 'payments' | null
  const [combinedModalOpen, setCombinedModalOpen] = useState(false)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [expandedPayRec, setExpandedPayRec]   = useState(null)
  const [leaveConfirm, setLeaveConfirm]       = useState(false)

  useEffect(() => { initPayments() }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenPayment) setCombinedModalOpen(true)
  }, [autoOpenPayment])

  const currentUser = getCurrentUser()
  const members     = getMembersByGroupId(group.id)
  const sub         = currentUser ? getSubscriptionByUserAndGroup(currentUser.id, group.id) : null
  const myMember    = currentUser ? members.find(m => m.userId === currentUser.id) ?? null : null
  const payRecords  = sub
    ? getPaymentRecordsBySubscriptionId(sub.id).sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''))
    : []

  const serviceDef        = getServiceById(group.serviceId)
  const planDef           = serviceDef?.plans.find(p => p.name === group.planName)
  const isPaymentRelevant = !['recruiting', 'full'].includes(group.status)
  const isPaymentPhase    = ['active', 'pending_activation', 'pending_confirmation'].includes(group.status)

  const hasServiceInfoIssue = !!myMember?.serviceInfoIssueNote
  const hasServiceInfo      = !!myMember?.serviceInfo?.email && !hasServiceInfoIssue
  const hasPaymentFailed    = myMember?.paymentStatus === 'payment_failed'
  const needsFillInfo       = !!sub && isPaymentPhase && !hasServiceInfo
  const hasPendingPayment   = !!sub && ['pending', 'payment_failed'].includes(myMember?.paymentStatus) && isPaymentPhase && hasServiceInfo
  const isGroupPending      = ['pending_activation', 'pending_confirmation'].includes(group.status)
  const hasMarkedPaid       = !!myMember && myMember.paymentStatus === 'markedPaid' && isGroupPending
  const hasConfirmedPaid    = !!myMember && myMember.paymentStatus === 'confirmed' && isGroupPending

  const showCombinedCta = (needsFillInfo || hasPendingPayment)
  const canLeaveGroup   = ['recruiting', 'full'].includes(group.status) && !!myMember

  function openMessages() {
    onClose()
    window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: group.id } }))
  }

  async function handleCombinedSubmit({ serviceEmail, proofUrl, paidAmount, serviceInfoChanged }) {
    const now = todayISO()

    if (serviceInfoChanged && myMember) {
      await updateMember(myMember.id, { serviceInfo: { email: serviceEmail.trim() }, serviceInfoIssueNote: null })
      const convId = `group_${group.id}`
      if (group.hostId) {
        sendActionMessage(convId, {
          actionType: 'member_filled_service_info',
          text: `${myMember.userName} 已完成填寫服務帳號`,
          visibleTo: [group.hostId],
          participants: [group.hostId],
        }).catch(console.error)
      }
      sendActionMessage(convId, {
        actionType: 'go_to_payment',
        text: '你已完成填寫服務帳號，請前往付款以完成加入流程。',
        visibleTo: [currentUser.id],
        participants: [currentUser.id],
      }).catch(console.error)
      const updatedMembers = getMembersByGroupId(group.id)
      const allFilled = updatedMembers.every(m => !!m.serviceInfo?.email)
      if (allFilled && group.hostId) {
        sendActionMessage(convId, {
          actionType: 'all_service_info_filled',
          text: '所有成員已完成填寫服務帳號，現在可以進行收款確認。',
          visibleTo: [group.hostId],
          participants: [group.hostId],
        }).catch(console.error)
      }
    }

    if (sub) {
      markSubscriptionPaid(sub.id)
      if (myMember) {
        await updateMember(myMember.id, {
          paymentStatus: 'markedPaid',
          lastPaidAt: now,
          paymentProofUrl: proofUrl,
          paidAmount,
          paymentIssueType: null,
          paymentIssueNote: null,
        })
      }
      createNotification({
        userId: currentUser.id,
        type: 'payment',
        title: '已付款，等待團主確認',
        message: `${sub.serviceName} ${sub.planName} 已付款，等待團主確認。`,
      })
      const grp = getGroupById(sub.groupId)
      if (grp?.hostId) {
        createNotification({
          userId: grp.hostId,
          type: 'member_payment_marked',
          title: '成員已付款',
          message: `${currentUser?.name ?? '成員'} 已在 ${sub.serviceName} ${sub.planName} 完成付款，請前往確認收款。`,
          meta: { groupId: sub.groupId },
        })
      }
    }

    setShowPaymentSuccess(true)
  }

  function buildSubPanel() {
    if (activePanel === 'members') {
      return {
        title: `成員名單（${members.length + 1} 人）`,
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

    if (activePanel === 'payments') {
      return {
        title: '付款紀錄',
        icon: <Receipt size={18} className="text-brand" />,
        content: (
          <div className="p-5 space-y-2">
            {myMember && ['markedPaid', 'payment_failed'].includes(myMember.paymentStatus) && (() => {
              const key    = 'pending-payment'
              const open   = expandedPayRec === key
              const failed = myMember.paymentStatus === 'payment_failed'
              return (
                <div className="overflow-hidden rounded-xl border border-line">
                  <button
                    onClick={() => setExpandedPayRec(open ? null : key)}
                    className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-raised"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">本期付款</p>
                    </div>
                    <span className={`text-xs font-semibold ${failed ? 'text-danger' : 'text-warning-text'}`}>
                      {failed ? '付款失敗' : '待確認'}
                    </span>
                    {open ? <ChevronUp size={14} className="shrink-0 text-ink-3" /> : <ChevronDown size={14} className="shrink-0 text-ink-3" />}
                  </button>
                  {open && (
                    <div className="border-t border-line-subtle px-4 py-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <CreditCard size={14} className="shrink-0 text-ink-3" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink">已付款金額</p>
                          {myMember.lastPaidAt && <p className="text-xs text-ink-3">{myMember.lastPaidAt}</p>}
                        </div>
                        <span className="shrink-0 text-sm font-bold text-ink">NT${myMember.paidAmount ?? sub?.pricePerSeat ?? '—'}</span>
                      </div>
                      {myMember.paymentProofUrl ? (
                        <a href={myMember.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                          <img src={myMember.paymentProofUrl} alt="付款截圖" className="w-full rounded-xl border border-line object-contain transition-opacity hover:opacity-80" />
                        </a>
                      ) : (
                        <p className="text-xs text-ink-4">尚未上傳截圖</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
            {payRecords.length === 0 && !(['markedPaid', 'payment_failed'].includes(myMember?.paymentStatus)) && (
              <EmptyState icon={Receipt} title="尚無付款紀錄" />
            )}
            {payRecords.map(rec => {
              const open = expandedPayRec === rec.id
              return (
                <div key={rec.id} className="overflow-hidden rounded-xl border border-line">
                  <button
                    onClick={() => setExpandedPayRec(open ? null : rec.id)}
                    className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-raised"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">已完成付款</p>
                      <p className="text-xs text-ink-3">{rec.paidAt?.slice(0, 10)}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-success">NT${rec.amount}</span>
                    <span className="text-xs font-semibold text-success">已確認</span>
                    {open ? <ChevronUp size={14} className="shrink-0 text-ink-3" /> : <ChevronDown size={14} className="shrink-0 text-ink-3" />}
                  </button>
                  {open && (
                    <div className="border-t border-line-subtle px-4 py-3 space-y-2">
                      {rec.proofUrl ? (
                        <a href={rec.proofUrl} target="_blank" rel="noopener noreferrer">
                          <img src={rec.proofUrl} alt="付款截圖" className="w-full rounded-xl border border-line object-contain transition-opacity hover:opacity-80" />
                        </a>
                      ) : (
                        <p className="text-xs text-ink-4">無截圖紀錄</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
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
      headerBanner={hasServiceInfoIssue ? (
        <div className="flex items-center justify-center bg-warning-subtle px-6 py-3 text-sm font-extrabold text-warning-text">
          服務帳號有問題，需要修正
        </div>
      ) : hasPaymentFailed ? (
        <div className="flex items-center justify-center bg-danger-subtle px-6 py-3 text-sm font-extrabold text-danger">
          付款失敗，請重新完成補件
        </div>
      ) : needsFillInfo ? (
        <div className="flex items-center justify-center bg-brand-subtle px-6 py-3 text-sm font-extrabold text-brand">
          請填寫服務帳號以完成加入流程
        </div>
      ) : undefined}
      centeredCta={showCombinedCta ? (
        <div className="flex justify-center py-2">
          <div className="relative">
            <span className={`absolute inset-1 rounded-xl animate-ping opacity-20 ${(hasPaymentFailed || hasServiceInfoIssue) ? 'bg-danger' : 'bg-brand'}`} />
            <button
              onClick={() => setCombinedModalOpen(true)}
              className={`relative flex items-center gap-2 rounded-xl px-6 py-2 text-sm font-bold text-white shadow-md transition-colors ${
                (hasPaymentFailed || hasServiceInfoIssue) ? 'bg-danger hover:opacity-90' : 'bg-brand hover:bg-brand-hover'
              }`}
            >
              <CreditCard size={14} />
              {hasServiceInfoIssue ? '修正服務帳號' : needsFillInfo ? '填寫服務帳號' : hasPaymentFailed ? '重新上傳付款憑證' : '前往付款'}
            </button>
          </div>
        </div>
      ) : undefined}
      extraInfoRows={[
        ...(group.paymentMethod ? [{ label: '付款方式', value: group.paymentMethod }] : []),
      ]}
      statusBadgeOverride={group.status === 'recruiting' && !!sub ? 'member_joined' : undefined}
      pendingBadge={
        hasConfirmedPaid  ? '付款已確認，等待團主啟用服務' :
        hasMarkedPaid     ? '已付款，等待團主確認' :
        hasPaymentFailed  ? '付款憑證有問題，請重新補件' :
        hasServiceInfoIssue ? '服務帳號需要修正' :
        needsFillInfo     ? '請填寫服務帳號以完成加入流程' :
        group.status === 'full' && !!sub ? '招募完成，等待團主啟用群組' :
        group.status === 'recruiting' && !!sub ? '已通過申請，需等待其他人加入' :
        undefined
      }
      pendingBadgeColor={
        hasConfirmedPaid || (['recruiting', 'full'].includes(group.status) && !!sub) ? 'success' :
        hasPaymentFailed || hasServiceInfoIssue ? 'danger' :
        undefined
      }
      bottomBar={(() => {
        const btnCount = 1 + (isPaymentRelevant ? 2 : 0) + (canLeaveGroup ? 1 : 0)
        return (
          <div className={`grid grid-cols-${btnCount} gap-1 p-2`}>
            <button
              onClick={() => setActivePanel('members')}
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
            >
              <Users size={17} /> 成員名單
            </button>
            {isPaymentRelevant && (
              <button
                onClick={() => setActivePanel('payments')}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
              >
                <Receipt size={17} /> 付款紀錄
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

    <CombinedServicePaymentModal
      isOpen={combinedModalOpen}
      onClose={() => setCombinedModalOpen(false)}
      group={group}
      member={myMember}
      sub={sub}
      onSubmit={handleCombinedSubmit}
    />

    {leaveConfirm && (
      <ConfirmDialog
        title="退出群組"
        message={`確定要退出「${group.serviceName}」群組嗎？退出後名額將釋出，若要再加入需要重新提出申請。`}
        confirmLabel="退出"
        danger
        onConfirm={() => { setLeaveConfirm(false); onLeaveGroup?.() }}
        onCancel={() => setLeaveConfirm(false)}
      />
    )}

    {showPaymentSuccess && (
      <ConfirmDialog
        icon={<CheckCircle2 size={18} className="text-success" />}
        title="提交成功"
        message="付款截圖已上傳，已通知團主確認付款，請等待確認。"
        confirmLabel="完成"
        onConfirm={() => setShowPaymentSuccess(false)}
      />
    )}

  </>
  )
}
