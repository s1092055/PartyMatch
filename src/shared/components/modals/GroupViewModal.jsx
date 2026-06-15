import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Banknote, Calendar, CheckCircle2, CreditCard,
  MessageCircle, PlayCircle, Receipt, Shield, UserX, Users, X,
} from 'lucide-react'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import ProgressBar from '../ui/ProgressBar'
import ServiceLogo from '../ui/ServiceLogo'
import EmptyState from '../ui/EmptyState'
import PaymentStatusBadge from '../ui/PaymentStatusBadge'
import { getGroupById } from '../../stores/groupStore'
import { getServiceById } from '../../services/serviceTypes'
import { getMembersByGroupId } from '../../stores/memberStore'
import { getApplicationsByGroupId } from '../../stores/applicationStore'
import { getSubscriptionByUserAndGroup } from '../../stores/subscriptionStore'
import { getPaymentRecordsBySubscriptionId } from '../../stores/paymentStore'
import { getActiveUser } from '../../stores/userStore'
import { todayISO } from '../../utils/date'
import { useScrollLock } from '../../utils/hooks'
import { CONFIRMED_STATUSES, READY_TO_ACTIVATE_STATUSES } from '../../constants/paymentStatus'

export default function GroupViewModal({
  isOpen, onClose, groupId,
  onConfirmMember,
  onActivate,
  onRemoveMember,
  onMarkPaid,
  onContactHost,
}) {
  const [activating, setActivating]       = useState(false)
  const [renewalDate, setRenewalDate]     = useState('')
  const [removingMemberId, setRemovingId] = useState(null)

  useScrollLock(isOpen)

  if (!isOpen || !groupId) return null

  const group      = getGroupById(groupId)
  if (!group) return null

  const serviceDef = getServiceById(group.serviceId)
  const planDef    = serviceDef?.plans.find(p => p.name === group.planName)

  const currentUser   = getActiveUser()
  const isHost        = currentUser?.id === group.hostId
  const members       = getMembersByGroupId(groupId)
  const applications  = isHost ? getApplicationsByGroupId(groupId) : []
  const appByMemberId = Object.fromEntries(
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

  const isActivated = ['active', 'paused', 'cancelled', 'ended'].includes(group.status)

  const stats = [
    { Icon: Banknote, label: '每席月費',  value: `NT$${group.pricePerSeat}` },
    { Icon: Calendar, label: '計費週期',  value: group.billingCycle === 'yearly' ? '年繳' : '月繳' },
    { Icon: Users,    label: '成員',      value: `${group.usedSeats} / ${group.totalSeats} 人` },
    ...(isActivated
      ? [{ Icon: Calendar, label: '下次扣款', value: group.nextBillingDate ?? '—' }]
      : [{ Icon: Calendar, label: '建立日期', value: group.createdAt ?? '—' }]),
  ]

  return createPortal(
    <>
      <div className="fixed inset-0 z-[55] bg-black/50" onClick={onClose} />

      <div className="pointer-events-none fixed inset-0 z-[56] flex items-center justify-center p-4 md:p-8">
        <div
          className="pointer-events-auto flex w-full flex-col overflow-hidden rounded-2xl bg-canvas shadow-2xl md:max-w-4xl"
          style={{ height: 'min(92vh, 800px)' }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-5">
            <div className="flex items-center gap-2.5">
              <ServiceLogo serviceId={group.serviceId} size={28} className="rounded-lg" />
              <span className="text-lg font-extrabold text-ink">{group.serviceName}</span>
              <span className="rounded-md bg-raised px-2 py-0.5 text-xs font-bold text-ink-3">{group.planName}</span>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              aria-label="關閉"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6 lg:flex-row lg:items-start lg:overflow-hidden lg:p-8">

            {/* ── LEFT: management content ── */}
            <div className="order-2 min-w-0 flex-1 space-y-5 lg:order-1 lg:h-full lg:overflow-y-auto lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">

              {/* Service / plan description */}
              {(serviceDef?.description || planDef?.description) && (
                <div className="rounded-xl bg-raised px-4 py-3 text-xs leading-relaxed text-ink-3">
                  {serviceDef?.description && <p>{serviceDef.description}</p>}
                  {planDef?.description && (
                    <p className="mt-1 text-ink-2">
                      <span className="font-semibold text-ink-3">{group.planName}：</span>
                      {planDef.description}
                    </p>
                  )}
                </div>
              )}

              {/* Member list */}
              <div>
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
                          {currentUser?.id === group.hostId && (
                            <span className="ml-1.5 text-xs font-normal text-brand">（你）</span>
                          )}
                        </p>
                        <p className="text-xs text-ink-3">建立 {group.createdAt}</p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                        <Shield size={11} /> 團主
                      </span>
                    </div>
                  </div>

                  {/* Member rows */}
                  {members.map(m => {
                    const app      = appByMemberId[m.userId]
                    const isMe     = m.userId === currentUser?.id
                    const removable = canRemove(m)

                    return (
                      <div key={m.id} className="rounded-xl border border-line p-3">
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

                        {isHost && (
                          <div className="mt-2 flex flex-wrap items-center gap-2 pl-9">
                            {app?.message && (
                              <p className="w-full text-xs italic text-ink-3">「{app.message}」</p>
                            )}
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
                                    className="rounded-lg bg-danger px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                                  >
                                    確認移除
                                  </button>
                                  <button
                                    onClick={() => setRemovingId(null)}
                                    className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink-2 hover:bg-raised"
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
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Member: payment records */}
              {!isHost && (
                <div>
                  <p className="mb-3 text-sm font-extrabold text-ink">我的付款紀錄</p>

                  {myMember?.paymentStatus === 'pending' && sub && (
                    <button
                      onClick={() => { onMarkPaid?.(sub); onClose() }}
                      className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
                    >
                      <CreditCard size={14} /> 標記已付款
                    </button>
                  )}

                  {onContactHost && sub && (
                    <button
                      onClick={() => { onContactHost(sub); onClose() }}
                      className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-ink"
                    >
                      <MessageCircle size={14} /> 聯絡團主
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

              {/* Host: activate */}
              {canActivateNow && (
                <div>
                  {activating ? (
                    <div className="rounded-2xl border border-brand/30 bg-brand-subtle p-4">
                      <p className="mb-1 text-sm font-semibold text-ink">確認啟用服務</p>
                      <p className="mb-4 text-xs text-ink-3">
                        點擊確認代表你已在外部完成「{group.serviceName}」的訂閱服務設定，並已將成員加入服務。
                      </p>
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
            {/* ── END LEFT ── */}

            {/* ── RIGHT: summary card ── */}
            <div className="order-1 lg:order-2 lg:w-[18rem] lg:shrink-0">
              <div className="card divide-y divide-line-subtle overflow-hidden">

                {/* Status */}
                <div className="px-5 py-4">
                  <Badge variant={group.status} />
                </div>

                {/* Price */}
                <div className="px-5 py-4">
                  <p className="mb-0.5 text-xs text-ink-4">每席月費</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-ink">NT${group.pricePerSeat}</span>
                    <span className="text-sm text-ink-3">/月</span>
                  </div>
                </div>

                {/* Seats */}
                <div className="px-5 py-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-ink-3">成員名額</span>
                    <span className="font-semibold text-ink">{group.usedSeats} / {group.totalSeats} 人</span>
                  </div>
                  <ProgressBar value={group.usedSeats} max={group.totalSeats} />
                  <div className="mt-1.5 flex justify-between text-xs text-ink-4">
                    <span>已佔 {group.usedSeats} 人</span>
                    <span>共 {group.totalSeats} 人</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-px bg-line-subtle">
                  {stats.map(({ Icon, label, value }) => (
                    <div key={label} className="bg-canvas px-4 py-3">
                      <div className="mb-1 flex items-center gap-1.5 text-xs text-ink-4">
                        <Icon size={11} />{label}
                      </div>
                      <p className="text-xs font-bold text-ink">{value}</p>
                    </div>
                  ))}
                </div>

              </div>
            </div>
            {/* ── END RIGHT ── */}

          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
