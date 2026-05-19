import { useState } from 'react'
import {
  Banknote, Calendar, CheckCircle2, CreditCard,
  PlayCircle, Receipt, Shield, UserX, Users,
} from 'lucide-react'
import Modal from '../ui/Modal'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import ProgressBar from '../ui/ProgressBar'
import ServiceLogo from '../ui/ServiceLogo'
import EmptyState from '../ui/EmptyState'
import PaymentStatusBadge from '../ui/PaymentStatusBadge'
import { getGroupById } from '../../stores/groupStore'
import { getMembersByGroupId } from '../../stores/memberStore'
import { getApplicationsByGroupId } from '../../stores/applicationStore'
import { getSubscriptionByUserAndGroup } from '../../stores/subscriptionStore'
import { getPaymentRecordsBySubscriptionId } from '../../stores/paymentStore'
import { getActiveUser } from '../../stores/userStore'
import { todayISO } from '../../utils/date'
import { CONFIRMED_STATUSES, READY_TO_ACTIVATE_STATUSES } from '../../constants/paymentStatus'


// ── Main component ─────────────────────────────────────────────────
export default function GroupViewModal({
  isOpen, onClose, groupId,
  onConfirmMember,
  onActivate,
  onRemoveMember,
  onMarkPaid,
}) {
  const [activating, setActivating]         = useState(false)
  const [renewalDate, setRenewalDate]       = useState('')
  const [removingMemberId, setRemovingId]   = useState(null)

  if (!isOpen || !groupId) return null

  const group       = getGroupById(groupId)
  if (!group) return null

  const currentUser = getActiveUser()
  const isHost      = currentUser?.id === group.hostId
  const members     = getMembersByGroupId(groupId)

  const applications   = isHost ? getApplicationsByGroupId(groupId) : []
  const appByMemberId  = Object.fromEntries(
    applications.map(a => [(a.applicantId ?? a.userId), a])
  )

  const myMember = !isHost && currentUser
    ? members.find(m => m.userId === currentUser.id) ?? null
    : null
  const sub = !isHost && currentUser
    ? getSubscriptionByUserAndGroup(currentUser.id, groupId)
    : null
  const payRecords = sub
    ? getPaymentRecordsBySubscriptionId(sub.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt))
    : []

  let confirmedCount = 0
  let allReadyActivate = members.length > 0
  for (const m of members) {
    if (CONFIRMED_STATUSES.includes(m.paymentStatus)) confirmedCount++
    if (!READY_TO_ACTIVATE_STATUSES.includes(m.paymentStatus)) allReadyActivate = false
  }
  const canActivateNow = isHost && allReadyActivate &&
    ['recruiting', 'full', 'pending_activation'].includes(group.status)

  const minRenewalDate = todayISO()

  function handleActivateConfirm() {
    onActivate?.(renewalDate || null)
    setActivating(false)
    setRenewalDate('')
    onClose()
  }

  function canRemove(member) {
    return !CONFIRMED_STATUSES.includes(member.paymentStatus)
  }

  // ── Stats grid ──────────────────────────────────────────────────
  const stats = [
    { Icon: Banknote, label: '每席月費',  value: `NT$${group.pricePerSeat}` },
    { Icon: Calendar, label: '計費週期',  value: group.billingCycle === 'yearly' ? '年繳' : '月繳' },
    { Icon: Users,    label: '成員',      value: `${group.usedSeats} / ${group.totalSeats} 人` },
    { Icon: Calendar, label: '下次扣款',  value: group.nextBillingDate ?? '—' },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${group.serviceName} · ${group.planName}`}
      titleIcon={<ServiceLogo serviceId={group.serviceId} size={28} />}
      maxWidth="max-w-lg"
    >
      <div className="divide-y divide-line-subtle">

        {/* ── 群組資訊 ─────────────────────────────────────────── */}
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant={group.status} />
            {group.isHostVerified && (
              <span className="flex items-center gap-1 text-xs text-success-text">
                <Shield size={12} /> 已認證團主
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ Icon, label, value }) => (
              <div key={label} className="rounded-xl bg-raised p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-ink-3">
                  <Icon size={12} />{label}
                </div>
                <p className="text-sm font-bold text-ink">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 成員名單 ─────────────────────────────────────────── */}
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-extrabold text-ink">
              成員名單
              <span className="ml-1 font-normal text-ink-3">（{members.length + 1} 人）</span>
            </p>
            {isHost && (
              <span className="text-xs text-ink-3">{confirmedCount}/{members.length} 已確認</span>
            )}
          </div>

          {isHost && <ProgressBar value={confirmedCount} max={members.length} className="mb-3" />}

          <div className="space-y-2">
            {/* Host row */}
            <div className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-3">
                <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {group.hostName}
                    {currentUser?.id === group.hostId && <span className="ml-1.5 text-xs font-normal text-brand">（你）</span>}
                  </p>
                  <p className="text-xs text-ink-3">建立 {group.createdAt}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                  <Shield size={11} /> 團主
                </span>
              </div>
            </div>

            {members.map(m => {
              const app     = appByMemberId[m.userId]
              const isMe    = m.userId === currentUser?.id
              const removable = canRemove(m)

                return (
                  <div key={m.id} className="rounded-xl border border-line p-3">
                    {/* Row */}
                    <div className="flex items-center gap-3">
                      <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">
                          {m.userName}
                          {isMe && <span className="ml-1.5 text-xs font-normal text-brand">（你）</span>}
                        </p>
                        <p className="text-xs text-ink-3">加入 {m.joinedAt}</p>
                      </div>
                      {isHost && <PaymentStatusBadge status={m.paymentStatus} />}
                    </div>

                    {/* Host-only: app message + actions */}
                    {isHost && (
                      <div className="mt-2 pl-9 flex flex-col gap-2">
                        {app?.message && (
                          <p className="text-xs text-ink-3 italic">「{app.message}」</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {m.paymentStatus === 'markedPaid' && (
                            <button
                              onClick={() => onConfirmMember?.(m)}
                              className="flex items-center gap-1 rounded-lg bg-success-subtle px-2.5 py-1 text-xs font-semibold text-success-text transition-colors hover:bg-success-subtle/80"
                            >
                              <CheckCircle2 size={11} /> 確認收款
                            </button>
                          )}
                          {removable && (
                            removingMemberId === m.id ? (
                              <>
                                <button
                                  onClick={() => { onRemoveMember?.(m); setRemovingId(null) }}
                                  className="rounded-lg bg-danger px-2.5 py-1 text-2xs font-semibold text-white hover:bg-red-700"
                                >
                                  確認移除
                                </button>
                                <button
                                  onClick={() => setRemovingId(null)}
                                  className="rounded-lg border border-line px-2.5 py-1 text-2xs font-semibold text-ink-2 hover:bg-raised"
                                >
                                  取消
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setRemovingId(m.id)}
                                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
                              >
                                <UserX size={12} /> 移除成員
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>

        {/* ── 我的付款紀錄 (member only) ─────────────────────── */}
        {!isHost && (
          <div className="p-5">
            <p className="mb-3 text-sm font-extrabold text-ink">我的付款紀錄</p>

            {myMember?.paymentStatus === 'pending' && sub && (
              <button
                onClick={() => { onMarkPaid?.(sub); onClose() }}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
              >
                <CreditCard size={14} /> 標記已付款
              </button>
            )}

            {payRecords.length === 0 ? (
              <EmptyState icon={Receipt} title="尚無付款紀錄" className="py-6" />
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
        )}

        {/* ── 啟用服務 (host only, when all ready) ─────────────── */}
        {canActivateNow && (
          <div className="p-5">
            {activating ? (
              <div className="rounded-2xl border border-brand/30 bg-brand-subtle p-4">
                <p className="mb-1 text-sm font-semibold text-ink">確認啟用服務</p>
                <p className="mb-4 text-xs text-ink-3">
                  點擊確認代表你已在外部完成「{group.serviceName}」的訂閱服務設定，並已將成員加入服務。
                </p>

                {/* Renewal date picker */}
                <label className="mb-1 block text-xs font-semibold text-ink-2">
                  下次扣款日 <span className="font-normal text-ink-3">（選填，預設依計費週期自動計算）</span>
                </label>
                <input
                  type="date"
                  min={minRenewalDate}
                  value={renewalDate}
                  onChange={e => setRenewalDate(e.target.value)}
                  className="mb-4 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/20"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => { setActivating(false); setRenewalDate('') }}
                    className="flex-1 rounded-xl border border-line py-2 text-sm font-semibold text-ink-2 hover:bg-raised"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleActivateConfirm}
                    className="flex-1 rounded-xl bg-brand py-2 text-sm font-bold text-white hover:bg-brand-hover"
                  >
                    確認，已啟用服務
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setActivating(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
              >
                <PlayCircle size={15} /> 啟用服務
              </button>
            )}
          </div>
        )}

      </div>
    </Modal>
  )
}
