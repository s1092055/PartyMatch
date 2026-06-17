import { useState } from 'react'
import {
  CheckCircle2, CreditCard, LogOut, MessageCircle, Receipt, Shield, Users,
} from 'lucide-react'
import Avatar from '../../../shared/ui/Avatar'
import Modal from '../../../shared/ui/Modal'
import ConfirmDialog from '../../../shared/ui/ConfirmDialog'
import GroupModalShell from '../../../shared/ui/GroupModalShell'
import EmptyState from '../../../shared/ui/EmptyState'
import PaymentStatusBadge from './PaymentStatusBadge'
import { getServiceById } from '../../../shared/utils/serviceUtils'
import { getMembersByGroupId } from '../../../shared/stores/memberStore'
import { getSubscriptionByUserAndGroup } from '../../../shared/stores/subscriptionStore'
import { getPaymentRecordsBySubscriptionId } from '../../../shared/stores/paymentStore'
import { getCurrentUser } from '../../../shared/stores/authStore'
import { scheduleLeaveGroup } from '../../../shared/utils/leaveGroupFlow'

export default function MemberGroupView({ group, onMarkPaid, onClose }) {
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const [showMembers, setShowMembers]         = useState(false)
  const [showPayments, setShowPayments]       = useState(false)

  const currentUser = getCurrentUser()
  const members     = getMembersByGroupId(group.id)
  const sub         = currentUser ? getSubscriptionByUserAndGroup(currentUser.id, group.id) : null
  const myMember    = currentUser ? members.find(m => m.userId === currentUser.id) ?? null : null
  const payRecords  = sub
    ? getPaymentRecordsBySubscriptionId(sub.id).sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''))
    : []

  const serviceDef  = getServiceById(group.serviceId)
  const planDef     = serviceDef?.plans.find(p => p.name === group.planName)
  const isEnded     = ['paused', 'cancelled', 'ended'].includes(group.status)

  function openMessages() {
    onClose()
    window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: group.id } }))
  }

  function handleLeaveConfirm() {
    setConfirmingLeave(false)
    if (currentUser) {
      scheduleLeaveGroup({
        conversationId: `group_${group.id}`,
        groupId: group.id,
        user: currentUser,
        groupName: group.groupName ?? group.serviceName,
      })
    }
    onClose()
  }

  const markPaidCta = myMember?.paymentStatus === 'pending' && sub && (
    <div className="p-4">
      <button
        onClick={() => { onMarkPaid?.(sub); onClose() }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
      >
        <CreditCard size={14} /> 標記已付款
      </button>
    </div>
  )

  return (
    <GroupModalShell
      onClose={onClose}
      group={group}
      service={serviceDef}
      plan={planDef}
      summaryExtraRows={
        myMember ? (
          <div className="px-6 py-4 lg:px-8">
            <p className="mb-2 text-xs text-ink-4">我的付款狀態</p>
            <PaymentStatusBadge status={myMember.paymentStatus} />
          </div>
        ) : undefined
      }
      summaryFooter={markPaidCta || undefined}
      mobileFooter={markPaidCta || undefined}
      bottomBar={
        <div className={`grid gap-1 p-2 ${isEnded ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <button
            onClick={() => setShowMembers(true)}
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
          >
            <Users size={17} /> 成員名單
          </button>
          <button
            onClick={() => setShowPayments(true)}
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
          >
            <Receipt size={17} /> 付款紀錄
          </button>
          {!isEnded && (
            <button
              onClick={() => setConfirmingLeave(true)}
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger-subtle"
            >
              <LogOut size={17} /> 退出群組
            </button>
          )}
        </div>
      }
    >
      {/* 退出群組確認 */}
      {confirmingLeave && (
        <ConfirmDialog
          title="退出群組"
          message={`確定要退出「${group.groupName ?? group.serviceName}」嗎？退出後會立即釋出你的名額並離開聊天室，之後想再加入需要重新申請並等待團主審核；已產生的費用不會自動退還。`}
          confirmLabel="退出"
          danger
          onConfirm={handleLeaveConfirm}
          onCancel={() => setConfirmingLeave(false)}
        />
      )}

      {/* ── 成員名單 Modal ── */}
      <Modal isOpen={showMembers} onClose={() => setShowMembers(false)} title={`成員名單（${members.length + 1} 人）`} maxWidth="max-w-lg">
        <div className="max-h-[60vh] overflow-y-auto p-5">
          <div className="space-y-2">
            <div className="rounded-xl border border-line p-3">
              <div className="flex flex-wrap items-center gap-3">
                <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{group.hostName}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                  <Shield size={11} /> 團主
                </span>
                <button
                  onClick={() => { setShowMembers(false); openMessages() }}
                  className="hidden shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised hover:text-ink lg:flex"
                >
                  <MessageCircle size={11} /> 聯絡團主
                </button>
              </div>
              <div className="mt-2 flex justify-end pl-9 lg:hidden">
                <button
                  onClick={() => { setShowMembers(false); openMessages() }}
                  className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised hover:text-ink"
                >
                  <MessageCircle size={11} /> 聯絡團主
                </button>
              </div>
            </div>
            {members.filter(m => m.userId !== currentUser?.id).map(m => (
              <div key={m.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-3">
                  <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{m.userName}</p>
                    <p className="text-xs text-ink-3">加入 {m.joinedAt}</p>
                  </div>
                  <PaymentStatusBadge status={m.paymentStatus} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* ── 付款紀錄 Modal ── */}
      <Modal isOpen={showPayments} onClose={() => setShowPayments(false)} title="付款紀錄" maxWidth="max-w-lg">
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {payRecords.length === 0 ? (
            <EmptyState icon={Receipt} title="尚無付款紀錄" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-line">
              {payRecords.map(rec => (
                <div key={rec.id} className="flex items-center gap-3 border-b border-line-subtle px-4 py-3 last:border-0">
                  <CheckCircle2 size={15} className="shrink-0 text-success" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{rec.periodLabel || rec.paidAt}</p>
                    <p className="text-xs text-ink-3">{rec.paidAt}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-success">NT${rec.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </GroupModalShell>
  )
}
