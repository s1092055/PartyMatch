import { useState } from 'react'
import {
  Banknote, Check, CheckCircle2, ChevronDown, ChevronUp,
  ClipboardList, CreditCard,
  LogOut, MessageCircle, PlayCircle, Receipt, Shield, UserX, Users, X,
} from 'lucide-react'
import Avatar from '../ui/Avatar'
import ProgressBar from '../ui/ProgressBar'
import PaymentStatusBadge from '../ui/PaymentStatusBadge'
import CreditScoreBadge from '../ui/CreditScoreBadge'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'
import GroupModalShell from '../ui/GroupModalShell'
import EmptyState from '../ui/EmptyState'
import { getGroupById } from '../stores/groupStore'
import { getServiceById } from '../utils/serviceUtils'
import { getMembersByGroupId } from '../stores/memberStore'
import { getApplicationsByGroupId } from '../stores/applicationStore'
import { getSubscriptionByUserAndGroup } from '../stores/subscriptionStore'
import { getPaymentRecordsBySubscriptionId } from '../stores/paymentStore'
import { getCurrentUser } from '../stores/authStore'
import { todayISO } from '../utils/date'
import { scheduleLeaveGroup } from '../utils/leaveGroupFlow'
import { CONFIRMED_STATUSES, READY_TO_ACTIVATE_STATUSES } from '../constants/paymentStatus'

// ── 申請卡片（申請管理 Modal 用）────────────────────────────────────────────────

function ApplicationCard({ app, groupFull, error, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false)
  const name    = app.applicantName ?? app.userName ?? '申請者'
  const initial = app.applicantAvatarInitial ?? app.userAvatarInitial ?? name[0]
  const color   = app.applicantAvatarColor ?? app.userAvatarColor ?? '#94A3B8'
  const isPending = app.status === 'pending'

  return (
    <div className={`rounded-2xl border border-line bg-surface p-4 transition-opacity ${isPending ? '' : 'opacity-60'}`}>
      <div className="flex items-start gap-3">
        <Avatar initial={initial} color={color} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">{name}</p>
                <CreditScoreBadge score={app.applicantCreditScore ?? 80} />
              </div>
              <p className="mt-0.5 text-2xs text-ink-4">{app.createdAt}</p>
            </div>
            {!isPending && (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${app.status === 'approved' ? 'bg-success-subtle text-success-text' : 'bg-red-50 text-red-600'}`}>
                {app.status === 'approved' ? '已核准' : '已拒絕'}
              </span>
            )}
          </div>
          {app.message && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-1 text-xs text-ink-3 transition-colors hover:text-ink"
              >
                申請留言 {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
              {expanded && (
                <p className="mt-1.5 rounded-xl bg-raised px-3 py-2 text-xs leading-relaxed text-ink-2">{app.message}</p>
              )}
            </div>
          )}
          {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
          {isPending && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onApprove(app.id)}
                disabled={groupFull}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-success py-2 text-xs font-semibold text-white transition-colors hover:bg-success-text disabled:pointer-events-none disabled:opacity-40"
              >
                {groupFull ? '已額滿' : <><Check size={12} strokeWidth={3} /> 核准</>}
              </button>
              <button
                onClick={() => onReject(app.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-xs font-semibold text-ink-2 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <X size={12} strokeWidth={3} /> 拒絕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 團主視角 ──────────────────────────────────────────────────────────────────

function HostView({ group, members, applications, onConfirmMember, onRemoveMember, onActivate, onApprove, onReject, errors, onClose }) {
  const [activating, setActivating]             = useState(false)
  const [renewalDate, setRenewalDate]           = useState('')
  const [removingMember, setRemovingMember]     = useState(null)
  const [showMembers, setShowMembers]           = useState(false)
  const [showApplications, setShowApplications] = useState(false)
  const [showBilling, setShowBilling]           = useState(false)

  const serviceDef    = getServiceById(group.serviceId)
  const planDef       = serviceDef?.plans.find(p => p.name === group.planName)
  const appByMemberId = Object.fromEntries(applications.map(a => [(a.applicantId ?? a.userId), a]))
  const pendingApps   = applications.filter(a => a.status === 'pending')
  const groupFull     = group.openSeats <= 0

  let confirmedCount   = 0
  let allReadyActivate = members.length > 0
  for (const m of members) {
    if (CONFIRMED_STATUSES.includes(m.paymentStatus)) confirmedCount++
    if (!READY_TO_ACTIVATE_STATUSES.includes(m.paymentStatus)) allReadyActivate = false
  }
  const markedPaidCount = members.filter(m => m.paymentStatus === 'markedPaid').length
  const canActivateNow  = allReadyActivate && ['recruiting', 'full', 'pending_activation'].includes(group.status)

  function handleActivateConfirm() {
    onActivate?.(renewalDate || null)
    setActivating(false)
    setRenewalDate('')
    onClose()
  }

  const activateCta = canActivateNow && (
    <div className="p-4">
      {activating ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-ink">確認啟用服務</p>
          <p className="text-xs text-ink-3">
            點擊確認代表你已在外部完成「{group.serviceName}」的訂閱設定，並已將成員加入服務。
          </p>
          <label className="block text-xs font-semibold text-ink-2">
            下次扣款日<span className="ml-1 font-normal text-ink-3">（選填）</span>
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
            >取消</button>
            <button
              onClick={handleActivateConfirm}
              className="flex-1 rounded-xl bg-brand py-2 text-sm font-bold text-white hover:bg-brand-hover"
            >確認啟用</button>
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
  )

  return (
    <GroupModalShell
      onClose={onClose}
      group={group}
      service={serviceDef}
      plan={planDef}
      summaryFooter={activateCta || undefined}
      mobileFooter={activateCta || undefined}
      bottomBar={
        <div className="grid grid-cols-3 gap-1 p-2">
          <button
            onClick={() => setShowMembers(true)}
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
          >
            <Users size={17} /> 成員名單
          </button>
          <button
            onClick={() => setShowApplications(true)}
            className="relative flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
          >
            <span className="relative">
              <ClipboardList size={17} />
              {pendingApps.length > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning-text px-0.5 text-[10px] font-bold text-white">
                  {pendingApps.length}
                </span>
              )}
            </span>
            申請管理
          </button>
          <button
            onClick={() => setShowBilling(true)}
            className="relative flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
          >
            <span className="relative">
              <Banknote size={17} />
              {markedPaidCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning-text px-0.5 text-[10px] font-bold text-white">
                  {markedPaidCount}
                </span>
              )}
            </span>
            收款紀錄
          </button>
        </div>
      }
    >
      {/* 移除成員確認 */}
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

      {/* ── 成員名單 Modal ── */}
      <Modal isOpen={showMembers} onClose={() => setShowMembers(false)} title={`成員名單（${members.length + 1} 人）`} maxWidth="max-w-lg">
        <div className="max-h-[60vh] overflow-y-auto p-5">
          <div className="mb-3 flex items-center justify-between text-xs text-ink-3">
            <span>{confirmedCount}/{members.length} 已確認</span>
          </div>
          <ProgressBar value={confirmedCount} max={members.length} className="mb-3" />
          <div className="space-y-2">
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
                        setShowMembers(false)
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
                        <Shield size={11} /> 確認收款
                      </button>
                    )}
                    {removable && (
                      <button
                        onClick={() => { setShowMembers(false); setRemovingMember(m) }}
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
      </Modal>

      {/* ── 申請管理 Modal ── */}
      <Modal isOpen={showApplications} onClose={() => setShowApplications(false)} title="申請管理" maxWidth="max-w-lg">
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {applications.length === 0 ? (
            <EmptyState icon={ClipboardList} title="目前沒有任何申請紀錄" description="你的群組暫時沒有新的加入申請。" />
          ) : (
            <div className="space-y-3">
              {applications.map(app => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  groupFull={groupFull}
                  error={errors?.[app.id]}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ── 收款紀錄 Modal ── */}
      <Modal isOpen={showBilling} onClose={() => setShowBilling(false)} title="收款紀錄" maxWidth="max-w-lg">
        <div className="max-h-[60vh] overflow-y-auto p-5">
          <div className="mb-3 flex items-center justify-between text-xs text-ink-3">
            <span>{confirmedCount}/{members.length} 已確認</span>
          </div>
          <ProgressBar value={confirmedCount} max={members.length} className="mb-3" />
          {members.length === 0 ? (
            <EmptyState icon={Banknote} title="目前尚無成員" />
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-center gap-3">
                    <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{m.userName}</p>
                      <p className="text-xs text-ink-3">加入 {m.joinedAt}</p>
                    </div>
                    <PaymentStatusBadge status={m.paymentStatus} />
                  </div>
                  {m.paymentStatus === 'markedPaid' && (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => onConfirmMember?.(m)}
                        className="flex items-center gap-1 rounded-lg bg-success-subtle px-2.5 py-1 text-xs font-semibold text-success-text transition-colors hover:bg-success-subtle/80"
                      >
                        <CheckCircle2 size={11} /> 確認收款
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </GroupModalShell>
  )
}

// ── 成員視角 ──────────────────────────────────────────────────────────────────

function MemberView({ group, onMarkPaid, onClose }) {
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

// ── 匯出：依角色選擇視角 ──────────────────────────────────────────────────────

export default function GroupViewModal({
  isOpen, onClose, groupId,
  onConfirmMember,
  onActivate,
  onRemoveMember,
  onMarkPaid,
  onApprove,
  onReject,
  errors,
}) {
  if (!isOpen || !groupId) return null

  const group = getGroupById(groupId)
  if (!group) return null

  const currentUser  = getCurrentUser()
  const isHost       = currentUser?.id === group.hostId
  const members      = getMembersByGroupId(groupId)
  const applications = isHost ? getApplicationsByGroupId(groupId) : []

  if (isHost) return (
    <HostView
      group={group}
      members={members}
      applications={applications}
      onConfirmMember={onConfirmMember}
      onRemoveMember={onRemoveMember}
      onActivate={onActivate}
      onApprove={onApprove}
      onReject={onReject}
      errors={errors}
      onClose={onClose}
    />
  )

  return (
    <MemberView
      group={group}
      onMarkPaid={onMarkPaid}
      onClose={onClose}
    />
  )
}
