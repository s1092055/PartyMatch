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
import CustomSelect from '../../../shared/ui/CustomSelect'

// ── 申請卡片 ──────────────────────────────────────────────────────────────────

function ApplicationCard({ app, groupFull, error, onApprove, onReject, isLeft = false }) {
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
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                isLeft ? 'bg-slate-100 text-slate-500' :
                app.status === 'approved' ? 'bg-success-subtle text-success-text' : 'bg-danger-subtle text-danger-text'
              }`}>
                {isLeft ? '已退出' : app.status === 'approved' ? '已核准' : app.status === 'removed' ? '已移除' : '已拒絕'}
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

export default function HostGroupView({ group, members, applications, onConfirmMember, onReportPaymentIssue, onReportServiceInfoIssue, onRemoveMember, onActivate, onActivateGroup, onApprove, onReject, errors, onClose, autoOpenActivateGroup, autoOpenActivate, onAutoOpenActivateDone, autoOpenApplications, autoOpenBilling }) {
  const [showActivate, setShowActivate]                   = useState(false)
  const [removingMember, setRemovingMember]               = useState(null)
  const [showMembers, setShowMembers]                     = useState(false)
  const [showApplications, setShowApplications]           = useState(false)
  const [appFilter, setAppFilter]                         = useState('all')
  const [showBilling, setShowBilling]                     = useState(false)
  const [showActivateGroupConfirm, setShowActivateGroupConfirm] = useState(false)
  const [paymentAccount, setPaymentAccount] = useState('')
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
    if (autoOpenActivateGroup && group.status === 'full') setShowActivateGroupConfirm(true)
  }, [autoOpenActivateGroup]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenApplications) setShowApplications(true)
  }, [autoOpenApplications])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenBilling) setShowBilling(true)
  }, [autoOpenBilling])

  useEffect(() => {
    if (autoOpenActivate) { openActivate(); onAutoOpenActivateDone?.() }
  }, [autoOpenActivate]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const [finalConfirmed, setFinalConfirmed]         = useState(false)
  const [memberChecks, setMemberChecks]             = useState({})
  const [serviceIssueMember, setServiceIssueMember] = useState(null)
  const [serviceIssueNote, setServiceIssueNote]     = useState('')

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

  const activateGroupBanner = group.status === 'full' && (
    <div className="flex items-center justify-center bg-success-subtle px-6 py-3 text-sm font-extrabold text-success-text">
      招募完成，請點擊啟用群組
    </div>
  )

  const activateGroupCta = group.status === 'full' && (
    <div className="flex justify-center py-2">
      <div className="relative">
        {!showActivateGroupConfirm && <span className="absolute inset-1 rounded-xl bg-success animate-ping opacity-20" />}
        <button
          onClick={() => setShowActivateGroupConfirm(true)}
          className="relative flex items-center gap-2 rounded-xl bg-success px-6 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-success-text"
        >
          <Radio size={15} /> 啟用群組
        </button>
      </div>
    </div>
  )

  const activateBanner = canActivateNow && (
    <div className="flex items-center justify-center gap-2 bg-success-subtle px-6 py-3 text-sm font-extrabold text-success-text">
      <CheckCircle2 size={15} />
      所有付款已確認，可以啟用服務了
    </div>
  )

  const activateCta = canActivateNow && (
    <div className="flex justify-center py-2">
      <div className="relative">
        {!showActivate && <span className="absolute inset-1 rounded-xl bg-success animate-ping opacity-20" />}
        <button
          onClick={openActivate}
          className="relative flex items-center gap-2 rounded-xl bg-success px-6 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-success-text"
        >
          <PlayCircle size={15} /> 啟用服務
        </button>
      </div>
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
      headerBanner={activateGroupBanner || activateBanner || undefined}
      centeredCta={activateGroupCta || activateCta || undefined}
      extraInfoRows={[
        ...(group.paymentMethod ? [{ label: '收款方式', value: group.paymentMethod }] : []),
      ]}
      pendingBadge={group.status === 'pending_confirmation' ? '收款中' : undefined}
      statusBadgeOverride={group.status === 'pending_confirmation' ? { variant: 'pending_confirmation', label: '收款中' } : undefined}
      bottomBar={(() => {
        return (
          <div className={`grid grid-cols-${isRecruiting ? 2 : 3} gap-1 p-2`}>
            <button
              onClick={() => setShowMembers(true)}
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
            >
              <Users size={17} /> 成員名單
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
        icon={<PlayCircle size={18} className="text-success" />}
        maxWidth="max-w-lg"
        sub
        footer={
          <button
            onClick={handleActivateConfirm}
            disabled={!allMembersChecked || !finalConfirmed}
            className="flex-1 rounded-xl bg-success py-2.5 text-sm font-bold text-white transition-colors hover:bg-success-text disabled:cursor-not-allowed disabled:opacity-40"
          >確認啟用</button>
        }
      >
        <div className="flex-1 min-h-0 overflow-y-auto">
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

          {/* ② 下次扣款日（唯讀顯示） */}
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

          {/* ③ 逐一確認成員已加入外部服務 */}
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
                <div
                  key={m.id}
                  className={`rounded-xl border p-3 transition-colors ${
                    memberChecks[m.id] ? 'border-success/40 bg-success-subtle' :
                    m.serviceInfoIssueNote ? 'border-warning/40 bg-warning-subtle' :
                    'border-line'
                  }`}
                >
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!memberChecks[m.id]}
                      onChange={e => setMemberChecks(prev => ({ ...prev, [m.id]: e.target.checked }))}
                      className="h-4 w-4 shrink-0 accent-brand"
                    />
                    <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{m.userName}</p>
                      {m.serviceInfoIssueNote ? (
                        <p className="text-xs text-warning-text">帳號問題已回報，等待修正</p>
                      ) : m.serviceInfo?.email ? (
                        <p className="text-xs text-ink-3">{m.serviceInfo.email}</p>
                      ) : (
                        <p className="text-xs text-ink-4">尚未填寫帳號</p>
                      )}
                    </div>
                    {memberChecks[m.id] && <CheckCircle2 size={16} className="shrink-0 text-success" />}
                  </label>
                  {m.serviceInfo?.email && !memberChecks[m.id] && (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => { setServiceIssueMember(m); setServiceIssueNote(m.serviceInfoIssueNote ?? '') }}
                        className="flex items-center gap-1 rounded-lg border border-warning/60 px-2.5 py-1 text-xs font-semibold text-warning-text transition-colors hover:bg-warning-subtle"
                      >
                        <AlertTriangle size={11} /> 帳號問題
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ④ 最終確認 */}
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
          </div>
        </div>
      </Modal>


      {/* ── 啟用群組 Modal（含填寫收款帳號）── */}
      <Modal
        isOpen={showActivateGroupConfirm}
        onClose={() => { setShowActivateGroupConfirm(false); setPaymentAccount('') }}
        title="啟用群組"
        icon={<Radio size={18} className="text-success" />}
        height="min(520px, 90vh)"
        sub
        footer={
          <div className="flex gap-2 w-full">
            <button
              onClick={() => { setShowActivateGroupConfirm(false); setPaymentAccount('') }}
              className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-raised"
            >取消</button>
            <button
              onClick={() => { setShowActivateGroupConfirm(false); onActivateGroup?.(paymentAccount.trim()); setPaymentAccount('') }}
              disabled={!paymentAccount.trim()}
              className="flex-1 rounded-xl bg-success py-2.5 text-sm font-bold text-white transition-colors hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-40"
            >確認啟用</button>
          </div>
        }
      >
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 px-5 py-4">
          <p className="text-sm text-ink-3">啟用後將開啟群組聊天室，系統會通知所有成員進行付款。</p>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-2">
              收款帳號資訊<span className="ml-0.5 text-danger">*</span>
            </label>
            <textarea
              rows={3}
              placeholder={`例如：\n台新銀行 帳號 0123-4567-8901\n戶名：王小明`}
              value={paymentAccount}
              onChange={e => setPaymentAccount(e.target.value)}
              maxLength={300}
              className="w-full resize-none rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <p className="mt-1 pl-1 text-xs text-ink-4">成員付款時將看到此資訊，請確認正確後再啟用</p>
          </div>
          {members.length > 0 && (
            <div className="rounded-xl bg-raised p-3 space-y-1.5">
              <p className="text-xs font-semibold text-ink-3 mb-2">即將通知以下成員</p>
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
          )}
        </div>
      </Modal>

    </GroupModalShell>

    {/* ── 成員名單 Modal ── */}
    <Modal
      isOpen={showMembers}
      onClose={() => setShowMembers(false)}
      title={`成員名單（${members.length + 1} 人）`}
      icon={<Users size={18} className="text-brand" />}
      maxWidth="max-w-lg"
      sub
    >
      <div className="h-[60vh] min-h-0 overflow-y-auto p-5">
        <div className="space-y-2">
          <div className="rounded-xl border border-line p-3">
            <div className="flex items-center gap-3">
              <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  {group.hostName}
                  <span className="ml-1.5 text-xs font-normal text-brand">（你）</span>
                </p>
                <p className="text-xs text-ink-3">{group.createdAt} 建立</p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                <Shield size={11} /> 團主
              </span>
            </div>
          </div>
          {members.map(m => {
            const app      = appByMemberId[m.userId]
            const removable = ['recruiting', 'full'].includes(group.status) && !CONFIRMED_STATUSES.includes(m.paymentStatus)
            return (
              <div key={m.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-3">
                  <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{m.userName}</p>
                    <p className="text-xs text-ink-3">{m.joinedAt} 加入</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => {
                        setShowMembers(false)
                        onClose()
                        window.dispatchEvent(new CustomEvent('pm:open-dm', {
                          detail: {
                            hostId: m.userId,
                            hostName: m.userName,
                            hostAvatarInitial: m.userAvatarInitial,
                            hostAvatarColor: m.userAvatarColor,
                          },
                        }))
                      }}
                      className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-brand"
                    >
                      <MessageCircle size={20} />
                    </button>
                    {removable && (
                      <button
                        onClick={() => setRemovingMember(m)}
                        className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-red-500"
                      >
                        <UserX size={20} />
                      </button>
                    )}
                  </div>
                </div>
                {app?.message && (
                  <div className="mt-2 pl-9">
                    <p className="text-xs italic text-ink-3">「{app.message}」</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Modal>

    {/* ── 申請管理 Modal ── */}
    <Modal isOpen={showApplications} onClose={() => { setShowApplications(false); setAppFilter('all') }} title="申請管理" icon={<ClipboardList size={18} className="text-brand" />} maxWidth="max-w-lg" sub>
      {applications.length > 0 && (() => {
        const memberUserIds = new Set(members.map(m => m.userId))
        const isLeft = a => a.status === 'approved' && !memberUserIds.has(a.applicantId ?? a.userId)
        const leftCount     = applications.filter(isLeft).length
        const approvedCount = applications.filter(a => a.status === 'approved' && !isLeft(a)).length
        return (
          <div className="px-5 py-3">
            <CustomSelect
              value={appFilter}
              onChange={setAppFilter}
              options={[
                { value: 'all',      label: `全部（${applications.length}）` },
                { value: 'pending',  label: `審核中（${applications.filter(a => a.status === 'pending').length}）` },
                { value: 'approved', label: `已核准（${approvedCount}）` },
                { value: 'left',     label: `已退出（${leftCount}）` },
                { value: 'removed',  label: `已移除（${applications.filter(a => a.status === 'removed').length}）` },
                { value: 'rejected', label: `已拒絕（${applications.filter(a => a.status === 'rejected').length}）` },
              ]}
            />
          </div>
        )
      })()}
      <div className="h-[60vh] min-h-0 overflow-y-auto px-5 pb-5 pt-2">
        {applications.length === 0 ? (
          <EmptyState icon={ClipboardList} title="目前沒有任何申請紀錄" description="你的群組暫時沒有新的加入申請。" />
        ) : (() => {
          const memberUserIds = new Set(members.map(m => m.userId))
          const isLeft = a => a.status === 'approved' && !memberUserIds.has(a.applicantId ?? a.userId)
          const filteredApps = applications.filter(a => {
            if (appFilter === 'all')      return true
            if (appFilter === 'left')     return isLeft(a)
            if (appFilter === 'approved') return a.status === 'approved' && !isLeft(a)
            return a.status === appFilter
          })
          return filteredApps.length === 0
            ? <EmptyState icon={ClipboardList} title="沒有符合的申請紀錄" />
            : (
              <div className="space-y-3">
                {filteredApps.map(app => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    isLeft={isLeft(app)}
                    groupFull={groupFull}
                    error={errors?.[app.id]}
                    onApprove={app => { onApprove?.(app); setShowApplications(false); setAppFilter('all') }}
                    onReject={onReject}
                  />
                ))}
              </div>
            )
        })()}
      </div>
    </Modal>

    {/* ── 收款紀錄 Modal ── */}
    <Modal isOpen={showBilling} onClose={() => setShowBilling(false)} title="收款管理" icon={<Banknote size={18} className="text-brand" />} maxWidth="max-w-lg" sub>
        {(group.paymentMethod || group.paymentAccount) && (
          <div className="shrink-0 border-b border-line-subtle px-5 py-3 flex gap-4">
            {group.paymentMethod && (
              <div className="min-w-0">
                <p className="text-2xs font-semibold text-ink-4">收款方式</p>
                <p className="mt-0.5 text-sm text-ink">{group.paymentMethod}</p>
              </div>
            )}
            {group.paymentAccount && (
              <div className="min-w-0 flex-1">
                <p className="text-2xs font-semibold text-ink-4">收款帳號</p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm font-semibold text-ink">{group.paymentAccount}</p>
              </div>
            )}
          </div>
        )}
        <div className="h-[60vh] min-h-0 overflow-y-auto scrollbar-none">
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
                            <span className={`text-xs font-semibold ${
                              CONFIRMED_STATUSES.includes(m.paymentStatus) ? 'text-success' :
                              m.paymentStatus === 'payment_failed' ? 'text-danger' : 'text-ink-3'
                            }`}>
                              {CONFIRMED_STATUSES.includes(m.paymentStatus) ? '已確認' :
                               m.paymentStatus === 'payment_failed' ? '補件中' : '待確認'}
                            </span>
                            {expanded ? <ChevronUp size={14} className="shrink-0 text-ink-3" /> : <ChevronDown size={14} className="shrink-0 text-ink-3" />}
                          </button>
                          {expanded && (
                            <div className="border-t border-line-subtle px-4 py-3 space-y-3">
                              {m.paymentStatus === 'markedPaid' ? (
                                <>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                      <CreditCard size={14} className="shrink-0 text-ink-3" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-ink">成員已付款</p>
                                        <p className="text-xs text-ink-3">{m.lastPaidAt ?? '—'}</p>
                                      </div>
                                      <span className="shrink-0 text-sm font-bold text-ink">
                                        NT${m.paidAmount ?? group.pricePerSeat}
                                        {m.paidAmount && m.paidAmount !== group.pricePerSeat && (
                                          <span className="ml-1 text-xs font-normal text-warning-text">（應付 NT${group.pricePerSeat}）</span>
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
                              ) : m.paymentStatus === 'payment_failed' ? (
                                <>
                                  <div className="flex items-center gap-2 rounded-lg bg-danger-subtle px-3 py-2 text-xs font-semibold text-danger">
                                    <AlertTriangle size={12} /> 付款問題已回報，等待成員重新補件
                                  </div>
                                  {m.paymentIssueType && (
                                    <div className="space-y-1 rounded-lg bg-raised px-3 py-2.5">
                                      <p className="text-xs font-semibold text-ink-3">回報原因</p>
                                      <p className="text-sm font-semibold text-ink">
                                        {ISSUE_TYPES.find(t => t.key === m.paymentIssueType)?.label ?? m.paymentIssueType}
                                      </p>
                                      {m.paymentIssueNote && (
                                        <p className="text-xs text-ink-3">{m.paymentIssueNote}</p>
                                      )}
                                    </div>
                                  )}
                                  {m.paymentProofUrl && (
                                    <div className="space-y-1.5">
                                      <p className="text-xs text-ink-4">上次提交的截圖</p>
                                      <a href={m.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                                        <img
                                          src={m.paymentProofUrl}
                                          alt="付款截圖"
                                          className="w-full rounded-xl border border-line object-contain opacity-60 transition-opacity hover:opacity-90"
                                        />
                                      </a>
                                    </div>
                                  )}
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
      maxWidth="max-w-lg"
      height="min(calc(100vh - 2rem), 540px)"
      sub
      footer={
        <button
          onClick={handleSendIssueReport}
          disabled={!issueType || (issueType === 'other' && !issueNote.trim())}
          className="flex-1 rounded-xl bg-warning py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          發送通知
        </button>
      }
    >
      {reportModalMember && (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none p-5 space-y-4">
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
        </div>
      )}
    </Modal>

    {/* ── 回報帳號問題 Modal ── */}
    <Modal
      isOpen={!!serviceIssueMember}
      onClose={() => { setServiceIssueMember(null); setServiceIssueNote('') }}
      title="回報帳號問題"
      icon={<AlertTriangle size={18} className="text-warning-text" />}
      maxWidth="max-w-sm"
      sub
      footer={
        <button
          onClick={() => {
            if (!serviceIssueNote.trim() || !serviceIssueMember) return
            onReportServiceInfoIssue?.(serviceIssueMember, serviceIssueNote.trim())
            setServiceIssueMember(null)
            setServiceIssueNote('')
          }}
          disabled={!serviceIssueNote.trim()}
          className="flex-1 rounded-xl bg-warning py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          發送通知
        </button>
      }
    >
      {serviceIssueMember && (
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-raised px-4 py-3">
            <Avatar initial={serviceIssueMember.userAvatarInitial} color={serviceIssueMember.userAvatarColor} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{serviceIssueMember.userName}</p>
              <p className="text-xs text-ink-3">{serviceIssueMember.serviceInfo?.email ?? '—'}</p>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-2">說明帳號問題</label>
            <textarea
              rows={3}
              autoFocus
              placeholder="例如：此 Email 無法加入訂閱方案，請更換帳號..."
              value={serviceIssueNote}
              onChange={e => setServiceIssueNote(e.target.value)}
              className="w-full resize-none rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
      )}
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
  </>
  )
}
