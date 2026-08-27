import { useState } from 'react'
import { Banknote, Bell, CheckCircle2, Clock } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Avatar from '../../../shared/components/ui/Avatar'
import EmptyState from '../../../shared/components/ui/EmptyState'
import ProgressBar from '../../../shared/components/ui/ProgressBar'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import { createNotification } from '../../../shared/stores/notificationStore'

export default function PaymentStatusModal({ isOpen, onClose, group, members, onConfirmPayments, onConfirmMember }) {
  const [remindedIds, setRemindedIds] = useState(new Set())

  const confirmedCount = members.filter(m => ['paid', 'confirmed'].includes(m.paymentStatus)).length
  const totalCount = members.length
  const allConfirmed = totalCount > 0 && confirmedCount === totalCount
  const canConfirm = group?.status === 'pending_confirmation'
  const unpaidMembers = members.filter(m => !['paid', 'confirmed', 'markedPaid'].includes(m.paymentStatus))

  function sendReminder(member) {
    createNotification({
      userId:  member.userId,
      type:    'payment_reminder',
      title:   '付款提醒',
      message: `團主提醒你：「${group?.serviceName ?? ''}」群組的付款尚未完成，請盡快完成付款。`,
    })
    setRemindedIds(prev => new Set([...prev, member.id]))
  }

  function sendAllReminders() {
    unpaidMembers.forEach(m => sendReminder(m))
  }

  function renderMemberAction(m) {
    if (['paid', 'confirmed'].includes(m.paymentStatus)) {
      return (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={11} /> 已確認
        </span>
      )
    }

    if (m.paymentStatus === 'markedPaid') {
      if (!canConfirm) {
        return (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
            <CheckCircle2 size={11} /> 已標記
          </span>
        )
      }
      return (
        <button
          onClick={() => onConfirmMember?.(m)}
          className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          <CheckCircle2 size={11} /> 確認收款
        </button>
      )
    }

    if (remindedIds.has(m.id)) {
      return (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-ink-3">
          <CheckCircle2 size={11} /> 已傳送
        </span>
      )
    }

    if (canConfirm) {
      return (
        <button
          onClick={() => sendReminder(m)}
          className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
        >
          <Bell size={11} /> 催款
        </button>
      )
    }

    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        <Clock size={11} /> 待付款
      </span>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`收款狀態 · ${group?.serviceName ?? ''}`}
      titleIcon={<Banknote size={16} className="text-emerald-500" />}
      maxWidth="max-w-lg"
    >
      <div className="p-5">
        {/* Group + progress */}
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-raised p-4">
          <ServiceLogo serviceId={group?.serviceId} size={36} />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-ink">{group?.serviceName}</p>
            <p className="text-xs text-ink-3">{group?.planName}</p>
          </div>
          <span className="shrink-0 text-sm font-extrabold text-ink">
            {confirmedCount} / {totalCount} 已確認
          </span>
        </div>
        <ProgressBar value={confirmedCount} max={totalCount} className="mb-5" />

        {canConfirm && unpaidMembers.length > 1 && (
          <div className="mb-3 flex justify-end">
            <button
              onClick={sendAllReminders}
              disabled={unpaidMembers.every(m => remindedIds.has(m.id))}
              className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Bell size={12} />
              全部催款
            </button>
          </div>
        )}

        {totalCount === 0 ? (
          <EmptyState icon={Banknote} title="此群組目前沒有成員" />
        ) : (
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{m.userName}</p>
                  <p className="text-xs text-ink-3">
                    {['paid', 'confirmed'].includes(m.paymentStatus)
                      ? `已確認 · ${m.lastPaidAt ?? ''}`
                      : m.paymentStatus === 'markedPaid'
                        ? `已標記付款 · ${m.lastPaidAt ?? ''}`
                        : '尚未付款'}
                  </p>
                </div>
                {renderMemberAction(m)}
              </div>
            ))}
          </div>
        )}

        {canConfirm && (
          <div className="mt-5 border-t border-line-subtle pt-4">
            {!allConfirmed && (
              <p className="mb-3 text-xs text-warning-text">
                尚有 {totalCount - confirmedCount} 位成員未確認收款，請逐筆確認後再完成。
              </p>
            )}
            <button
              onClick={onConfirmPayments}
              disabled={!allConfirmed}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 bg-brand hover:bg-brand-hover"
            >
              確認收款完成，進入待啟用
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
