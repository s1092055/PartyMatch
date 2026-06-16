import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Banknote, Calendar, CheckCircle2, Clock, CreditCard,
  MessageCircle, Play, PlayCircle, Receipt, Shield, UserX, Users, X,
} from 'lucide-react'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import ProgressBar from '../ui/ProgressBar'
import ServiceLogo from '../ui/ServiceLogo'
import EmptyState from '../ui/EmptyState'
import PaymentStatusBadge from '../ui/PaymentStatusBadge'
import ConfirmDialog from '../ui/ConfirmDialog'
import { getGroupById } from '../stores/groupStore'
import { getServiceById } from '../utils/serviceUtils'
import { getMembersByGroupId } from '../stores/memberStore'
import { getApplicationsByGroupId } from '../stores/applicationStore'
import { getSubscriptionByUserAndGroup } from '../stores/subscriptionStore'
import { getPaymentRecordsBySubscriptionId } from '../stores/paymentStore'
import { getCurrentUser } from '../stores/authStore'
import { todayISO } from '../utils/date'
import { useScrollLock } from '../utils/hooks'
import { CONFIRMED_STATUSES, READY_TO_ACTIVATE_STATUSES } from '../constants/paymentStatus'

// ── 團主視角 ──────────────────────────────────────────────────────────────────

function HostView({ group, members, applications, onConfirmMember, onRemoveMember, onActivate, onClose }) {
  const [activating, setActivating]       = useState(false)
  const [renewalDate, setRenewalDate]     = useState('')
  const [removingMember, setRemovingMember] = useState(null)

  const serviceDef    = getServiceById(group.serviceId)
  const planDef       = serviceDef?.plans.find(p => p.name === group.planName)
  const appByMemberId = Object.fromEntries(
    applications.map(a => [(a.applicantId ?? a.userId), a])
  )

  let confirmedCount   = 0
  let allReadyActivate = members.length > 0
  for (const m of members) {
    if (CONFIRMED_STATUSES.includes(m.paymentStatus)) confirmedCount++
    if (!READY_TO_ACTIVATE_STATUSES.includes(m.paymentStatus)) allReadyActivate = false
  }
  const canActivateNow = allReadyActivate &&
    ['recruiting', 'full', 'pending_activation'].includes(group.status)

  const isActivated = ['active', 'paused', 'cancelled', 'ended'].includes(group.status)

  function handleActivateConfirm() {
    onActivate?.(renewalDate || null)
    setActivating(false)
    setRenewalDate('')
    onClose()
  }

  return (
    <>
    {removingMember && (
      <ConfirmDialog
        title="移除成員"
        message={`確定要將「${removingMember.userName}」移出群組嗎？對方會立即失去名額與聊天室存取權限，且會收到通知；若要再加入需要重新提出申請。`}
        confirmLabel="移除"
        danger
        onConfirm={() => { onRemoveMember?.(removingMember); setRemovingMember(null) }}
        onCancel={() => setRemovingMember(null)}
      />
    )}
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6 lg:flex-row lg:items-start lg:overflow-hidden lg:p-8">

      {/* ── LEFT: 服務介紹 + 規則 + 成員列表 ── */}
      <div className="order-2 min-w-0 flex-1 divide-y divide-line-subtle lg:order-1 lg:h-full lg:overflow-y-auto lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">

        {/* 服務介紹 */}
        <div className="space-y-3 pb-5">
          <p className="text-sm font-semibold text-ink">服務介紹</p>
          {serviceDef?.description && (
            <p className="text-sm leading-relaxed text-ink-2">{serviceDef.description}</p>
          )}
          {(() => {
            const chips = [
              { icon: Calendar, label: '方案',     value: group.planName },
              { icon: Users,    label: '共享方式', value: `${group.totalSeats} 人共享` },
              ...((planDef?.features?.length ?? 0) > 0
                ? [{ icon: Play, label: '主要功能', value: planDef.features[0] }]
                : []),
            ]
            return chips.length > 0 && (
              <div className={`grid gap-2 ${chips.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {chips.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex flex-col gap-1 rounded-xl border border-line bg-canvas p-3">
                    <Icon size={13} className="text-ink-3" />
                    <span className="text-xs text-ink-4">{label}</span>
                    <span className="text-xs font-bold leading-snug text-ink">{value}</span>
                  </div>
                ))}
              </div>
            )
          })()}
          {(planDef?.description || (planDef?.features?.length ?? 0) > 0) && (
            <div className="border-t border-line-subtle pt-3">
              {planDef?.description && (
                <p className="mb-2 text-sm text-ink-2">{planDef.description}</p>
              )}
              {(planDef?.features ?? []).length > 0 && (
                <ul className="space-y-1.5">
                  {planDef.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-brand" />
                      {feat}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* 加入條件與規則 */}
        {(() => {
          const allRules = [
            ...(group.requirements ? [group.requirements] : []),
            ...(group.rules ?? []),
          ]
          return (
            <div className="space-y-3 py-5">
              <p className="text-sm font-semibold text-ink">加入條件與規則</p>
              {allRules.length > 0 ? (
                <ul className="space-y-2">
                  {allRules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-4">此群組尚未設定加入規則</p>
              )}
            </div>
          )
        })()}

        {/* 成員名單 */}
        <div className="pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-extrabold text-ink">
            成員名單
            <span className="ml-1 font-normal text-ink-3">（{members.length + 1} 人）</span>
          </p>
          <span className="text-xs text-ink-3">{confirmedCount}/{members.length} 已確認</span>
        </div>

        <ProgressBar value={confirmedCount} max={members.length} className="mb-3" />

        <div className="space-y-2">
          {/* Host row */}
          <div className="rounded-xl border border-line p-3">
            <div className="flex items-center gap-3">
              <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  {group.hostName}（團主）
                  <span className="ml-1.5 text-xs font-normal text-brand">（你）</span>
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
            const removable = !CONFIRMED_STATUSES.includes(m.paymentStatus)

            return (
              <div key={m.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-3">
                  <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{m.userName}</p>
                    <p className="text-xs text-ink-3">加入 {m.joinedAt}</p>
                  </div>
                  <PaymentStatusBadge status={m.paymentStatus} />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 pl-9">
                  {app?.message && (
                    <p className="w-full text-xs italic text-ink-3">「{app.message}」</p>
                  )}
                  <button
                    onClick={() => {
                      onClose()
                      window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: group.id } }))
                    }}
                    className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised hover:text-ink"
                  >
                    <MessageCircle size={11} /> 聯絡
                  </button>
                  {m.paymentStatus === 'markedPaid' && (
                    <button
                      onClick={() => onConfirmMember?.(m)}
                      className="flex items-center gap-1 rounded-lg bg-success-subtle px-2.5 py-1 text-xs font-semibold text-success-text transition-colors hover:bg-success-subtle/80"
                    >
                      <CheckCircle2 size={11} /> 確認收款
                    </button>
                  )}
                  {removable && (
                    <button
                      onClick={() => setRemovingMember(m)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
                    >
                      <UserX size={12} /> 移除成員
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </div>
      </div>

      {/* ── RIGHT: 群組摘要 + 啟用 CTA ── */}
      <div className="order-1 lg:order-2 lg:w-[18rem] lg:shrink-0">
        <div className="card divide-y divide-line-subtle overflow-hidden">

          <div className="px-5 py-4">
            <Badge variant={group.status} />
          </div>

          <div className="px-5 py-4">
            <p className="mb-0.5 text-xs text-ink-4">每席月費</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-ink">NT${group.pricePerSeat}</span>
              <span className="text-sm text-ink-3">/月</span>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-ink-3">成員名額</span>
              <span className="font-semibold text-ink">{group.usedSeats} / {group.totalSeats} 人</span>
            </div>
            <ProgressBar value={group.usedSeats} max={group.totalSeats} />
          </div>

          <div className="grid grid-cols-2 gap-px bg-line-subtle">
            {[
              { Icon: Calendar, label: '計費週期', value: group.billingCycle === 'yearly' ? '年繳' : '月繳' },
              { Icon: isActivated ? Clock : Calendar,
                label: isActivated ? '下次扣款' : '建立日期',
                value: isActivated ? (group.nextBillingDate ?? '—') : (group.createdAt ?? '—') },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="bg-canvas px-4 py-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-ink-4"><Icon size={11} />{label}</div>
                <p className="text-xs font-bold text-ink">{value}</p>
              </div>
            ))}
          </div>

          {/* 啟用服務 CTA */}
          {canActivateNow && (
            <div className="p-4">
              {activating ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-ink">確認啟用服務</p>
                  <p className="text-xs text-ink-3">
                    點擊確認代表你已在外部完成「{group.serviceName}」的訂閱設定，並已將成員加入服務。
                  </p>
                  <label className="block text-xs font-semibold text-ink-2">
                    下次扣款日
                    <span className="ml-1 font-normal text-ink-3">（選填）</span>
                  </label>
                  <input
                    type="date"
                    min={todayISO()}
                    value={renewalDate}
                    onChange={e => setRenewalDate(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/20"
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
                      確認啟用
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActivating(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
                >
                  <PlayCircle size={15} /> 啟用服務
                </button>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
    </>
  )
}

// ── 成員視角 ──────────────────────────────────────────────────────────────────

function MemberView({ group, onMarkPaid, onClose }) {
  const currentUser = getCurrentUser()
  const members     = getMembersByGroupId(group.id)
  const sub         = currentUser ? getSubscriptionByUserAndGroup(currentUser.id, group.id) : null
  const myMember    = currentUser ? members.find(m => m.userId === currentUser.id) ?? null : null
  const payRecords  = sub
    ? getPaymentRecordsBySubscriptionId(sub.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt))
    : []

  const serviceDef = getServiceById(group.serviceId)
  const planDef    = serviceDef?.plans.find(p => p.name === group.planName)
  const isActivated = ['active', 'paused', 'cancelled', 'ended'].includes(group.status)

  function openMessages() {
    onClose()
    window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: group.id } }))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6 lg:flex-row lg:items-start lg:overflow-hidden lg:p-8">

      {/* ── LEFT: 服務介紹 + 規則 + 成員列表 + 付款紀錄 ── */}
      <div className="order-2 min-w-0 flex-1 divide-y divide-line-subtle lg:order-1 lg:h-full lg:overflow-y-auto lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">

        {/* 服務介紹 */}
        <div className="space-y-3 pb-5">
          <p className="text-sm font-semibold text-ink">服務介紹</p>
          {serviceDef?.description && (
            <p className="text-sm leading-relaxed text-ink-2">{serviceDef.description}</p>
          )}
          {(() => {
            const chips = [
              { icon: Calendar, label: '方案',     value: group.planName },
              { icon: Users,    label: '共享方式', value: `${group.totalSeats} 人共享` },
              ...((planDef?.features?.length ?? 0) > 0
                ? [{ icon: Play, label: '主要功能', value: planDef.features[0] }]
                : []),
            ]
            return chips.length > 0 && (
              <div className={`grid gap-2 ${chips.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {chips.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex flex-col gap-1 rounded-xl border border-line bg-canvas p-3">
                    <Icon size={13} className="text-ink-3" />
                    <span className="text-xs text-ink-4">{label}</span>
                    <span className="text-xs font-bold leading-snug text-ink">{value}</span>
                  </div>
                ))}
              </div>
            )
          })()}
          {(planDef?.description || (planDef?.features?.length ?? 0) > 0) && (
            <div className="border-t border-line-subtle pt-3">
              {planDef?.description && (
                <p className="mb-2 text-sm text-ink-2">{planDef.description}</p>
              )}
              {(planDef?.features ?? []).length > 0 && (
                <ul className="space-y-1.5">
                  {planDef.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-brand" />
                      {feat}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* 加入條件與規則 */}
        {(() => {
          const allRules = [
            ...(group.requirements ? [group.requirements] : []),
            ...(group.rules ?? []),
          ]
          return (
            <div className="space-y-3 py-5">
              <p className="text-sm font-semibold text-ink">加入條件與規則</p>
              {allRules.length > 0 ? (
                <ul className="space-y-2">
                  {allRules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-4">此群組尚未設定加入規則</p>
              )}
            </div>
          )
        })()}

        {/* 成員名單 */}
        <div className="space-y-3 py-5">
          <p className="text-sm font-semibold text-ink">
            成員名單
            <span className="ml-1 font-normal text-ink-3">（{members.length + 1} 人）</span>
          </p>
          <div className="space-y-2">
            {/* Host */}
            <div className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-3">
                <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{group.hostName}（團主）</p>
                  <p className="text-xs text-ink-3">建立 {group.createdAt}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                  <Shield size={11} /> 團主
                </span>
              </div>
              <div className="mt-2 pl-9">
                <button
                  onClick={openMessages}
                  className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised hover:text-ink"
                >
                  <MessageCircle size={11} /> 聯絡團主
                </button>
              </div>
            </div>
            {/* Other members */}
            {members.filter(m => m.userId !== currentUser?.id).map(m => (
              <div key={m.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-3">
                  <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{m.userName}</p>
                    <p className="text-xs text-ink-3">加入 {m.joinedAt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 付款紀錄 */}
        <div className="space-y-3 py-5">
          <p className="text-sm font-semibold text-ink">付款紀錄</p>
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
      </div>

      {/* ── RIGHT: 群組摘要 + 付款 CTA ── */}
      <div className="order-1 lg:order-2 lg:w-[18rem] lg:shrink-0">
        <div className="card divide-y divide-line-subtle overflow-hidden">

          <div className="px-5 py-4">
            <Badge variant={group.status} />
          </div>

          <div className="px-5 py-4">
            <p className="mb-0.5 text-xs text-ink-4">每席月費</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-ink">NT${group.pricePerSeat}</span>
              <span className="text-sm text-ink-3">/月</span>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-ink-3">成員名額</span>
              <span className="font-semibold text-ink">{group.usedSeats} / {group.totalSeats} 人</span>
            </div>
            <ProgressBar value={group.usedSeats} max={group.totalSeats} />
          </div>

          {myMember && (
            <div className="px-5 py-4">
              <p className="mb-2 text-xs text-ink-4">我的付款狀態</p>
              <PaymentStatusBadge status={myMember.paymentStatus} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-px bg-line-subtle">
            {[
              { Icon: Banknote, label: '計費週期', value: group.billingCycle === 'yearly' ? '年繳' : '月繳' },
              { Icon: Calendar,
                label: isActivated ? '下次扣款' : '建立日期',
                value: isActivated ? (group.nextBillingDate ?? '—') : (group.createdAt ?? '—') },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="bg-canvas px-4 py-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-ink-4"><Icon size={11} />{label}</div>
                <p className="text-xs font-bold text-ink">{value}</p>
              </div>
            ))}
          </div>

          {/* 付款 / 聯絡 CTA */}
          <div className="space-y-2 p-4">
            {myMember?.paymentStatus === 'pending' && sub && (
              <button
                onClick={() => { onMarkPaid?.(sub); onClose() }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
              >
                <CreditCard size={14} /> 標記已付款
              </button>
            )}
            <button
              onClick={openMessages}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-sm font-bold text-ink-2 transition-colors hover:bg-raised hover:text-ink"
            >
              <MessageCircle size={14} /> 聯絡團主
            </button>
          </div>

        </div>
      </div>

    </div>
  )
}

// ── 主元件 ────────────────────────────────────────────────────────────────────

export default function GroupViewModal({
  isOpen, onClose, groupId,
  onConfirmMember,
  onActivate,
  onRemoveMember,
  onMarkPaid,
}) {
  useScrollLock(isOpen)

  if (!isOpen || !groupId) return null

  const group = getGroupById(groupId)
  if (!group) return null

  const currentUser = getCurrentUser()
  const isHost      = currentUser?.id === group.hostId
  const members     = getMembersByGroupId(groupId)
  const applications = isHost ? getApplicationsByGroupId(groupId) : []

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

          {/* Body — 依角色切換 */}
          {isHost ? (
            <HostView
              group={group}
              members={members}
              applications={applications}
              onConfirmMember={onConfirmMember}
              onRemoveMember={onRemoveMember}
              onActivate={onActivate}
              onClose={onClose}
            />
          ) : (
            <MemberView
              group={group}
              onMarkPaid={onMarkPaid}
              onClose={onClose}
            />
          )}

        </div>
      </div>
    </>,
    document.body
  )
}
