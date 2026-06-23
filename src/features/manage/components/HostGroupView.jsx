import { useEffect, useState } from 'react'
import {
  AlertTriangle, Banknote, Check, CheckCircle2, ChevronDown, ChevronUp,
  ClipboardList, CreditCard, MessageCircle, PlayCircle, Radio, Shield, UserX, Users, X,
} from 'lucide-react'
import Avatar from '../../../shared/ui/Avatar'
import ProgressBar from '../../../shared/ui/ProgressBar'
import CreditScoreBadge from '../../../shared/ui/CreditScoreBadge'
import Modal from '../../../shared/ui/Modal'
import ConfirmDialog from '../../../shared/ui/ConfirmDialog'
import GroupModalShell from '../../../shared/ui/GroupModalShell'
import EmptyState from '../../../shared/ui/EmptyState'
import ServiceLogo from '../../../shared/ui/ServiceLogo'
import { getServiceById } from '../../../shared/utils/serviceUtils'
import { formatRelativeDate, toISODate } from '../../../shared/utils/date'
import { CONFIRMED_STATUSES } from '../../../shared/constants/paymentStatus'
import { getSubscriptionByUserAndGroup } from '../../../shared/stores/subscriptionStore'
import { getPaymentRecordsBySubscriptionId } from '../../../shared/stores/paymentStore'

// ── 申請卡片 ──────────────────────────────────────────────────────────────────

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
              <p className="mt-0.5 text-2xs text-ink-4">{formatRelativeDate(app.createdAt)}</p>
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


const ISSUE_TYPES = [
  { key: 'amount_mismatch',  label: '付款金額不符',      desc: '金額與應付金額不一致' },
  { key: 'proof_incomplete', label: '截圖不清晰或不完整', desc: '無法辨識截圖中的付款資訊' },
  { key: 'wrong_info',       label: '付款資訊有誤',       desc: '截圖顯示的資訊有誤' },
  { key: 'other',            label: '其他問題',           desc: '請填寫說明' },
]

export default function HostGroupView({ group, members, applications, onConfirmMember, onReportPaymentIssue, onRemoveMember, onActivate, onActivateGroup, onApprove, onReject, errors, onClose, autoOpenActivateGroup, autoOpenApplications, autoOpenBilling }) {
  const [showActivate, setShowActivate]                   = useState(false)
  const [removingMember, setRemovingMember]               = useState(null)
  const [showMembers, setShowMembers]                     = useState(false)
  const [showApplications, setShowApplications]           = useState(false)
  const [showBilling, setShowBilling]                     = useState(false)
  const [showActivateGroupConfirm, setShowActivateGroupConfirm] = useState(false)
  const [expandedBillingMembers, setExpandedBillingMembers] = useState(new Set())
  const [reportModalMember, setReportModalMember] = useState(null)
  // null or member object
  const [issueType, setIssueType] = useState('')
  const [issueNote, setIssueNote] = useState('')

  function openReportModal(member) {
    setShowBilling(false)
    setIssueType('')
    setIssueNote('')
    setReportModalMember(member)
  }

  function closeReportModal(reopen = false) {
    setReportModalMember(null)
    setIssueType('')
    setIssueNote('')
    if (reopen) setShowBilling(true)
  }

  function handleSendIssueReport() {
    if (!issueType || !reportModalMember) return
    onReportPaymentIssue?.(reportModalMember, issueType, issueNote)
    closeReportModal(false)
  }

  function toggleBillingMember(memberId) {
    setExpandedBillingMembers(prev => {
      const next = new Set(prev)
      next.has(memberId) ? next.delete(memberId) : next.add(memberId)
      return next
    })
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenActivateGroup && ['full', 'pending_confirmation'].includes(group.status)) setShowActivateGroupConfirm(true)
  }, [autoOpenActivateGroup]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenApplications) setShowApplications(true)
  }, [autoOpenApplications])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenBilling) setShowBilling(true)
  }, [autoOpenBilling])

  const serviceDef    = getServiceById(group.serviceId)
  const planDef       = serviceDef?.plans.find(p => p.name === group.planName)
  const appByMemberId = Object.fromEntries(applications.map(a => [(a.applicantId ?? a.userId), a]))
  const pendingApps   = applications.filter(a => a.status === 'pending')
  const groupFull     = group.openSeats <= 0

  let confirmedCount = 0
  for (const m of members) {
    if (CONFIRMED_STATUSES.includes(m.paymentStatus)) confirmedCount++
  }
  const markedPaidCount = members.filter(m => m.paymentStatus === 'markedPaid').length
  const canActivateNow  = group.status === 'pending_activation'
  const isActivated     = ['active', 'paused', 'cancelled', 'ended'].includes(group.status)

  const [finalConfirmed, setFinalConfirmed] = useState(false)
  const [memberChecks, setMemberChecks]     = useState({})

  const allMembersChecked = members.length > 0 && members.every(m => memberChecks[m.id])

  function openActivate() {
    setFinalConfirmed(false)
    setMemberChecks({})
    setShowActivate(true)
  }

  function closeActivate() {
    setShowActivate(false)
    setFinalConfirmed(false)
    setMemberChecks({})
  }

  function handleActivateConfirm() {
    onActivate?.(null)
    setShowActivate(false)
    setFinalConfirmed(false)
    setMemberChecks({})
    onClose()
  }

  const activateGroupCta = group.status === 'full' && (
    <div className="space-y-2 px-4 py-3">
      <div className="flex items-center justify-center rounded-xl bg-success-subtle px-4 py-3 text-sm font-extrabold text-success-text">
        招募完成，請點擊啟用群組
      </div>
      <button
        onClick={() => setShowActivateGroupConfirm(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
      >
        <Radio size={15} /> 啟用群組
      </button>
    </div>
  )

  const activateCta = canActivateNow && (
    <div className="space-y-2 px-4 py-3">
      <div className="flex items-center justify-center gap-2 rounded-xl bg-success-subtle px-4 py-3 text-sm font-extrabold text-success-text">
        <CheckCircle2 size={15} />
        所有付款已確認，可以啟用服務了
      </div>
      <button
        onClick={openActivate}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
      >
        <PlayCircle size={15} /> 啟用服務
      </button>
    </div>
  )

  const isRecruiting = ['recruiting', 'full'].includes(group.status)
  const shellHidden  = showMembers || showApplications || showBilling || !!reportModalMember

  return (
    <>
    <GroupModalShell
      onClose={onClose}
      group={group}
      service={serviceDef}
      plan={planDef}
      hideRecruitBar={group.status !== 'recruiting'}
      confirmedCount={confirmedCount}
      memberCount={members.length}
      hidden={shellHidden}
      centeredCta={activateGroupCta || activateCta || undefined}
      bottomBar={(() => {
        return (
          <div className={`grid grid-cols-${isRecruiting ? 2 : 3} gap-1 p-2`}>
            <button
              onClick={() => setShowMembers(true)}
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
            >
              <Users size={17} /> 成員管理
            </button>
            {isRecruiting ? (
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
            ) : (
              <>
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
                  收款管理
                </button>
                <button
                  onClick={() => {
                    onClose()
                    window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: group.id } }))
                  }}
                  className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
                >
                  <MessageCircle size={17} /> 群組訊息
                </button>
              </>
            )}
          </div>
        )
      })()}
    >
      {/* ── 啟用服務 Modal ── */}
      <Modal
        isOpen={showActivate}
        onClose={closeActivate}
        title="啟用服務"
        icon={<PlayCircle size={18} className="text-brand" />}
        maxWidth="max-w-lg"
        sub
      >
        <div className="max-h-[70vh] overflow-y-auto">

          {/* ① 服務摘要 */}
          <div className="flex items-center gap-3 border-b border-line-subtle px-5 py-4">
            <ServiceLogo serviceId={group.serviceId} size={40} className="rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink">{group.serviceName}</p>
              <p className="text-xs text-ink-3">{group.planName} · NT${group.pricePerSeat}/席/{group.billingCycle === 'yearly' ? '年' : '月'}</p>
            </div>
            <div className="rounded-xl bg-success-subtle px-3 py-1.5 text-right">
              <p className="text-xs text-success-text">撥款金額</p>
              <p className="text-base font-extrabold text-success-text">NT${group.pricePerSeat * members.length}</p>
            </div>
          </div>

          {/* ② 逐一確認成員已加入外部服務 */}
          <div className="px-5 pt-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-2">確認成員已加入外部服務</p>
              <p className="text-xs text-ink-3">
                {Object.values(memberChecks).filter(Boolean).length} / {members.length} 已確認
              </p>
            </div>
            <p className="mb-3 text-xs text-ink-3">請在外部訂閱平台（{group.serviceName}）確認每位成員的帳號已完成設定，再逐一打勾。</p>
            <div className="space-y-2">
              {members.length === 0 ? (
                <p className="py-2 text-center text-sm text-ink-3">尚無成員</p>
              ) : members.map(m => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                    memberChecks[m.id] ? 'border-success/40 bg-success-subtle' : 'border-line hover:bg-raised'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!memberChecks[m.id]}
                    onChange={e => setMemberChecks(prev => ({ ...prev, [m.id]: e.target.checked }))}
                    className="h-4 w-4 shrink-0 accent-brand"
                  />
                  <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{m.userName}</p>
                    {m.serviceInfo?.email ? (
                      <p className="text-xs text-ink-3">{m.serviceInfo.email}</p>
                    ) : (
                      <p className="text-xs text-ink-4">尚未填寫帳號</p>
                    )}
                  </div>
                  {memberChecks[m.id] && <CheckCircle2 size={16} className="shrink-0 text-success" />}
                </label>
              ))}
            </div>
          </div>

          {/* ③ 下次扣款日（唯讀顯示） */}
          {(() => {
            const d = new Date()
            if (group.billingCycle === 'yearly') d.setFullYear(d.getFullYear() + 1)
            else d.setMonth(d.getMonth() + 1)
            const nextDate = toISODate(d)
            return (
              <div className="mx-5 mt-5 flex items-center justify-between rounded-xl border border-line bg-raised px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-ink-2">下次扣款日</p>
                  <p className="mt-0.5 text-xs text-ink-4">啟用後自動設定，不可修改</p>
                </div>
                <p className="text-base font-extrabold text-ink">{nextDate}</p>
              </div>
            )
          })()}

          {/* ④ 最終確認 + 按鈕 */}
          <div className="space-y-3 p-5">
            {!allMembersChecked && (
              <p className="rounded-xl bg-warning-subtle px-4 py-2.5 text-xs font-semibold text-warning-text">
                請先逐一確認所有成員已在外部服務完成設定
              </p>
            )}
            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${allMembersChecked ? 'border-line hover:bg-raised' : 'pointer-events-none border-line opacity-40'}`}>
              <input
                type="checkbox"
                checked={finalConfirmed}
                onChange={e => setFinalConfirmed(e.target.checked)}
                disabled={!allMembersChecked}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
              />
              <span className="text-sm font-medium leading-relaxed text-ink">
                我確認所有成員皆已完成外部服務設定，同意平台依此結果進行撥款
              </span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={closeActivate}
                className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-raised"
              >取消</button>
              <button
                onClick={handleActivateConfirm}
                disabled={!allMembersChecked || !finalConfirmed}
                className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
              >確認啟用</button>
            </div>
          </div>
        </div>
      </Modal>

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

      {/* ── 啟用群組確認 Modal ── */}
      <Modal
        isOpen={showActivateGroupConfirm}
        onClose={() => setShowActivateGroupConfirm(false)}
        title={<span className="flex items-center gap-1.5"><Radio size={16} className="text-brand" />啟用群組</span>}
        maxWidth="max-w-sm"
        sub
        footer={
          <>
            <button
              onClick={() => setShowActivateGroupConfirm(false)}
              className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-raised"
            >
              取消
            </button>
            <button
              onClick={() => { setShowActivateGroupConfirm(false); onActivateGroup?.() }}
              className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
            >
              確認啟用
            </button>
          </>
        }
      >
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-ink-3">啟用後將開啟群組聊天室，系統會通知所有成員進行付款，並提示成員提供服務帳號資訊。</p>
          <div className="rounded-xl bg-raised p-3 space-y-1.5">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-2">
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-black text-white"
                  style={{ background: m.userAvatarColor }}
                >
                  {m.userAvatarInitial}
                </span>
                <p className="text-sm text-ink">{m.userName}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>

    </GroupModalShell>

    {/* ── 成員名單 Modal ── */}
    <Modal
      isOpen={showMembers}
      onClose={() => setShowMembers(false)}
      title={`成員管理（${members.length + 1} 人）`}
      maxWidth="max-w-lg"
      sub
    >
      <div className="max-h-[60vh] overflow-y-auto p-5">
        <div className="space-y-2">
          <div className="flex items-stretch gap-2">
            <div className="min-w-0 flex-1 rounded-xl border border-line p-3">
              <div className="flex items-center gap-3">
                <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {group.hostName}
                    <span className="ml-1.5 text-xs font-normal text-brand">（你）</span>
                  </p>
                  <p className="text-xs text-ink-3">建立 {group.createdAt}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                  <Shield size={11} /> 團主
                </span>
              </div>
            </div>
            <div className="w-14 shrink-0" />
          </div>
          {members.map(m => {
            const app      = appByMemberId[m.userId]
            const removable = !CONFIRMED_STATUSES.includes(m.paymentStatus)
            return (
              <div key={m.id} className="flex items-stretch gap-2">
                <div className="min-w-0 flex-1 rounded-xl border border-line p-3">
                  <div className="flex items-center gap-3">
                    <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{m.userName}</p>
                      <p className="text-xs text-ink-3">加入 {m.joinedAt}</p>
                    </div>
                  </div>
                  {(app?.message || removable) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 pl-9">
                      {app?.message && (
                        <p className="w-full text-xs italic text-ink-3">「{app.message}」</p>
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
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowMembers(false)
                    onClose()
                    window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: group.id } }))
                  }}
                  className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-brand text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                  <MessageCircle size={15} />聯絡
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>

    {/* ── 申請管理 Modal ── */}
    <Modal isOpen={showApplications} onClose={() => setShowApplications(false)} title="申請管理" maxWidth="max-w-lg" sub>
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
                onApprove={app => { onApprove?.(app); setShowApplications(false) }}
                onReject={onReject}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>

    {/* ── 收款紀錄 Modal ── */}
    <Modal isOpen={showBilling} onClose={() => setShowBilling(false)} title="收款管理" icon={<Banknote size={18} className="text-brand" />} maxWidth="max-w-lg" sub>
        <div className="max-h-[60vh] overflow-y-auto">
          {isActivated ? (
            /* 已啟用後：顯示歷史收款清單 */
            <div className="p-5">
              {members.length === 0 ? (
                <EmptyState icon={Banknote} title="目前尚無收款紀錄" />
              ) : (
                <div className="space-y-4">
                  {members.map(m => {
                    const sub      = getSubscriptionByUserAndGroup(m.userId, group.id)
                    const records  = sub ? getPaymentRecordsBySubscriptionId(sub.id).sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? '')) : []
                    const expanded = expandedBillingMembers.has(m.id)
                    return (
                      <div key={m.id} className="overflow-hidden rounded-xl border border-line">
                        <button
                          onClick={() => toggleBillingMember(m.id)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-raised"
                        >
                          <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                          <p className="min-w-0 flex-1 text-sm font-semibold text-ink">{m.userName}</p>
                          <span className="text-xs text-ink-3">{records.length} 筆</span>
                          {expanded ? <ChevronUp size={14} className="shrink-0 text-ink-3" /> : <ChevronDown size={14} className="shrink-0 text-ink-3" />}
                        </button>
                        {expanded && (
                          <div className="border-t border-line-subtle">
                            {records.length === 0 ? (
                              <p className="px-4 py-3 text-xs text-ink-3">尚無收款紀錄</p>
                            ) : records.map(rec => (
                              <div key={rec.id} className="border-b border-line-subtle px-4 py-3 last:border-0 space-y-2">
                                <div className="flex items-center gap-3">
                                  <CheckCircle2 size={14} className="shrink-0 text-success" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-ink">已收款金額</p>
                                    <p className="text-xs text-ink-3">{rec.paidAt?.slice(0, 10)}</p>
                                  </div>
                                  <span className="shrink-0 text-sm font-bold text-success">NT${rec.amount}</span>
                                </div>
                                {rec.proofUrl && (
                                  <a href={rec.proofUrl} target="_blank" rel="noopener noreferrer">
                                    <img src={rec.proofUrl} alt="付款截圖" className="w-full rounded-xl border border-line object-contain transition-opacity hover:opacity-80" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            /* 收款確認階段：顯示確認收款介面 */
            <>
              <div className="border-b border-line-subtle px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-0.5 text-xs text-ink-4">每席價格</p>
                    <p className="text-xl font-extrabold text-ink">
                      NT${group.pricePerSeat}
                      <span className="ml-1 text-sm font-normal text-ink-3">/{group.billingCycle === 'yearly' ? '年' : '月'}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mb-0.5 text-xs text-ink-4">收款確認進度</p>
                    <p className="text-sm font-semibold text-ink">{confirmedCount} / {members.length} 已確認</p>
                  </div>
                </div>
                <ProgressBar value={confirmedCount} max={members.length} className="mt-3" />
              </div>
              <div className="p-5">
                {members.length === 0 ? (
                  <EmptyState icon={Banknote} title="目前尚無成員" />
                ) : (
                  <div className="space-y-2">
                    {members.map(m => {
                      const sub      = getSubscriptionByUserAndGroup(m.userId, group.id)
                      const records  = sub ? getPaymentRecordsBySubscriptionId(sub.id).sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? '')) : []
                      const expanded = expandedBillingMembers.has(m.id)
                      return (
                        <div key={m.id} className="overflow-hidden rounded-xl border border-line">
                          <button
                            onClick={() => toggleBillingMember(m.id)}
                            className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-raised"
                          >
                            <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-ink">{m.userName}</p>
                            </div>
                            <span className={`text-xs font-semibold ${CONFIRMED_STATUSES.includes(m.paymentStatus) ? 'text-success' : 'text-ink-3'}`}>
                              {CONFIRMED_STATUSES.includes(m.paymentStatus) ? '已確認' : '待確認'}
                            </span>
                            {expanded ? <ChevronUp size={14} className="shrink-0 text-ink-3" /> : <ChevronDown size={14} className="shrink-0 text-ink-3" />}
                          </button>
                          {expanded && (
                            <div className="border-t border-line-subtle px-4 py-3 space-y-3">
                              {m.paymentStatus === 'markedPaid' && sub ? (
                                <>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                      <CreditCard size={14} className="shrink-0 text-ink-3" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-ink">成員已付款</p>
                                        <p className="text-xs text-ink-3">{m.lastPaidAt ?? '—'}</p>
                                      </div>
                                      <span className="shrink-0 text-sm font-bold text-ink">
                                        NT${m.paidAmount ?? sub.pricePerSeat}
                                        {m.paidAmount && m.paidAmount !== sub.pricePerSeat && (
                                          <span className="ml-1 text-xs font-normal text-warning-text">（應付 NT${sub.pricePerSeat}）</span>
                                        )}
                                      </span>
                                    </div>
                                    {m.paymentProofUrl ? (
                                      <a href={m.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                                        <img
                                          src={m.paymentProofUrl}
                                          alt="付款截圖"
                                          className="w-full rounded-xl border border-line object-contain transition-opacity hover:opacity-80"
                                        />
                                      </a>
                                    ) : (
                                      <p className="text-xs text-ink-4">尚未上傳截圖</p>
                                    )}
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => onConfirmMember?.(m)}
                                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-success py-2 text-xs font-semibold text-white transition-colors hover:opacity-80"
                                    >
                                      <CheckCircle2 size={11} /> 確認收款
                                    </button>
                                    <button
                                      onClick={() => openReportModal(m)}
                                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-warning/60 py-2 text-xs font-semibold text-warning-text transition-colors hover:bg-warning-subtle"
                                    >
                                      <AlertTriangle size={11} /> 回報問題
                                    </button>
                                  </div>
                                </>
                              ) : records.length === 0 ? (
                                <p className="text-xs text-ink-3">尚無付款紀錄</p>
                              ) : records.map(rec => (
                                <div key={rec.id} className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <CheckCircle2 size={14} className="shrink-0 text-success" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold text-ink">已收款金額</p>
                                      <p className="text-xs text-ink-3">{rec.paidAt?.slice(0, 10)}</p>
                                    </div>
                                    <span className="shrink-0 text-sm font-bold text-success">NT${rec.amount}</span>
                                  </div>
                                  {rec.proofUrl && (
                                    <a href={rec.proofUrl} target="_blank" rel="noopener noreferrer">
                                      <img src={rec.proofUrl} alt="付款截圖" className="w-full rounded-xl border border-line object-contain transition-opacity hover:opacity-80" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

    {/* ── 回報問題 Modal ── */}
    <Modal
      isOpen={!!reportModalMember}
      onClose={() => closeReportModal(true)}
      title="回報付款問題"
      icon={<AlertTriangle size={18} className="text-warning-text" />}
      maxWidth="max-w-sm"
      sub
    >
      {reportModalMember && (
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-raised px-4 py-3">
            <Avatar initial={reportModalMember.userAvatarInitial} color={reportModalMember.userAvatarColor} size="sm" />
            <p className="text-sm font-semibold text-ink">{reportModalMember.userName}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-ink-2">選擇問題類型</p>
            {ISSUE_TYPES.map(t => (
              <label
                key={t.key}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                  issueType === t.key
                    ? 'border-warning/60 bg-warning-subtle'
                    : 'border-line hover:bg-raised'
                }`}
              >
                <input
                  type="radio"
                  checked={issueType === t.key}
                  onChange={() => setIssueType(t.key)}
                  className="mt-0.5 shrink-0 accent-warning-text"
                />
                <div>
                  <p className="text-sm font-semibold text-ink">{t.label}</p>
                  <p className="text-xs text-ink-3">{t.desc}</p>
                </div>
              </label>
            ))}
          </div>
          {issueType && (
            <div>
              <textarea
                rows={3}
                placeholder={issueType === 'other' ? '請描述問題內容...' : '補充說明（選填）'}
                value={issueNote}
                onChange={e => setIssueNote(e.target.value)}
                className="w-full resize-none rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
              {issueType === 'other' && !issueNote.trim() && (
                <p className="mt-1 text-xs text-warning-text">其他問題請填寫說明內容</p>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => closeReportModal(true)}
              className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-raised"
            >
              取消
            </button>
            <button
              onClick={handleSendIssueReport}
              disabled={!issueType || (issueType === 'other' && !issueNote.trim())}
              className="flex-1 rounded-xl bg-warning py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              發送通知
            </button>
          </div>
        </div>
      )}
    </Modal>
  </>
  )
}
