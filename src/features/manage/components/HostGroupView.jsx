import { useEffect, useState } from 'react'
import {
  Banknote, Check, CheckCircle2, ChevronDown, ChevronUp,
  ClipboardList, History, MessageCircle, PlayCircle, Radio, Shield, Trash2, UserX, Users, X,
} from 'lucide-react'
import Avatar from '../../../shared/ui/Avatar'
import CreditScoreBadge from '../../../shared/ui/CreditScoreBadge'
import CountdownConfirmDialog from '../../../shared/ui/CountdownConfirmDialog'
import GroupModalShell from '../../../shared/ui/GroupModalShell'
import EmptyState from '../../../shared/ui/EmptyState'
import { getServiceById } from '../../../shared/utils/serviceUtils'
import { formatRelativeDate } from '../../../shared/utils/date'
import { useSubscriptionStore } from '../../../shared/stores/useSubscriptionStore'
import { useAuthStore } from '../../../shared/stores/useAuthStore'
import { useNotificationStore } from '../../../shared/stores/useNotificationStore'

const getSubscriptionByUserAndGroup = (uid, gid) => useSubscriptionStore.getState().getByUserAndGroup(uid, gid)
import CustomSelect from '../../../shared/ui/CustomSelect'
import ActivateServiceModal from './ActivateServiceModal'
import ReportServiceIssueModal from './ReportServiceIssueModal'

// ── 申請卡片 ──────────────────────────────────────────────────────────────────

const APP_STATUS_BADGE = {
  approved: { cls: 'bg-success-subtle text-success-text', label: '已核准' },
  left:     { cls: 'bg-slate-100 text-slate-500',         label: '已退出' },
  removed:  { cls: 'bg-danger-subtle text-danger-text',   label: '已移除' },
  rejected: { cls: 'bg-danger-subtle text-danger-text',   label: '已拒絕' },
}

function ApplicationCard({ app, groupFull, error, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false)
  const name    = app.applicantName ?? app.userName ?? '申請者'
  const initial = app.applicantAvatarInitial ?? app.userAvatarInitial ?? name[0]
  const color   = app.applicantAvatarColor ?? app.userAvatarColor ?? '#94A3B8'
  const isPending = app.status === 'pending'
  const badge = APP_STATUS_BADGE[app.status]

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
            {!isPending && badge && (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>
                {badge.label}
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

export default function HostGroupView({ group, members, applications, onReportServiceInfoIssue, onRemoveMember, onActivate, onActivateGroup, onCancelGroup, onApprove, onReject, errors, onClose, autoOpenActivateGroup, autoOpenActivate, onAutoOpenActivateDone, autoOpenApplications, autoOpenBilling }) {
  const [showActivate, setShowActivate]                   = useState(false)
  const [removingMember, setRemovingMember]               = useState(null)
  const [activePanel, setActivePanel]                     = useState(null) // 'members' | 'applications' | 'billing' | null
  const [showReviewHistory, setShowReviewHistory]         = useState(false)
  const [reviewFilter, setReviewFilter]                   = useState('all')
  const [showActivateGroupConfirm, setShowActivateGroupConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm]         = useState(false)
  const [expandedBillingMembers, setExpandedBillingMembers] = useState(new Set())

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
    if (autoOpenApplications) setActivePanel('applications')
  }, [autoOpenApplications])

  useEffect(() => {
    if (activePanel !== 'applications') return
    const user = useAuthStore.getState().getProfile()
    if (!user) return
    const notifStore = useNotificationStore.getState()
    notifStore.getByUserId(user.id)
      .filter(n => n.type === 'new_application' && n.meta?.groupId === group.id && !n.isRead)
      .forEach(n => notifStore.markRead(n.id))
  }, [activePanel, group.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenBilling) setActivePanel('billing')
  }, [autoOpenBilling])

  useEffect(() => {
    if (autoOpenActivate) { openActivate(); onAutoOpenActivateDone?.() }
  }, [autoOpenActivate]) // eslint-disable-line react-hooks/exhaustive-deps

  const serviceDef    = getServiceById(group.serviceId)
  const planDef       = serviceDef?.plans.find(p => p.name === group.planName)
  const appByMemberId = Object.fromEntries(applications.map(a => [(a.applicantId ?? a.userId), a]))
  const pendingApps   = applications.filter(a => a.status === 'pending')
  const groupFull     = group.openSeats <= 0

  const canActivateNow  = group.status === 'pending_activation'
  const isActivated     = ['active', 'cancelled', 'ended'].includes(group.status)

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
        {showActivateGroupConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowActivateGroupConfirm(false)}
              className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink-2 transition-colors hover:bg-raised"
            >取消</button>
            <button
              onClick={() => { setShowActivateGroupConfirm(false); onActivateGroup?.() }}
              className="rounded-xl bg-success px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-success-text"
            >確認啟用</button>
          </div>
        ) : (
          <button
            onClick={() => setShowActivateGroupConfirm(true)}
            className="relative flex items-center gap-2 rounded-xl bg-success px-6 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-success-text"
          >
            <Radio size={15} /> 啟用群組
          </button>
        )}
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

  const cancellableStatuses = ['recruiting', 'full', 'pending_confirmation', 'pending_activation']
  const canCancel = cancellableStatuses.includes(group.status)

  const cancelCta = canCancel && (
    <div className="flex justify-center py-2">
      <button
        onClick={() => setShowCancelConfirm(true)}
        className="flex items-center gap-2 rounded-xl border border-danger px-5 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger-subtle"
      >
        <Trash2 size={14} /> 解散群組
      </button>
    </div>
  )

  const isRecruiting = ['recruiting', 'full'].includes(group.status)

  function buildMembersPanel() {
    return {
        title: '成員名單',
        icon: <Users size={18} className="text-brand" />,
        content: (
          <div className="p-5 space-y-2">
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
              const app = appByMemberId[m.userId]
              const removable = ['recruiting', 'full'].includes(group.status)
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
                          setActivePanel(null)
                          onClose()
                          window.dispatchEvent(new CustomEvent('pm:open-dm', {
                            detail: { hostId: m.userId, hostName: m.userName, hostAvatarInitial: m.userAvatarInitial, hostAvatarColor: m.userAvatarColor },
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
        ),
      }
  }

  function buildApplicationsPanel() {
    return {
      title: '申請管理',
      icon: <ClipboardList size={18} className="text-brand" />,
      headerRight: (
        <button
          onClick={() => setShowReviewHistory(true)}
          className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-brand"
          title="審核紀錄"
        >
          <History size={18} />
        </button>
      ),
      content: (
        <div className="px-5 pb-5 pt-3">
          {pendingApps.length === 0 ? (
            <EmptyState icon={ClipboardList} title="目前沒有待審核的申請" description="新申請會出現在這裡。" />
          ) : (
            <div className="space-y-3">
              {pendingApps.map(app => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  groupFull={groupFull}
                  error={errors?.[app.id]}
                  onApprove={app => { onApprove?.(app); setActivePanel(null) }}
                  onReject={onReject}
                />
              ))}
            </div>
          )}
        </div>
      ),
    }
  }

  function buildReviewHistoryPanel() {
    const reviewedApps = applications.filter(a => a.status !== 'pending')
    const filteredApps = reviewFilter === 'all'
      ? reviewedApps
      : reviewedApps.filter(a => a.status === reviewFilter)
    return {
      title: '審核紀錄',
      icon: <History size={18} className="text-brand" />,
      stickyHeader: reviewedApps.length > 0 ? (
        <div className="border-b border-line-subtle px-5 py-3">
          <CustomSelect
            value={reviewFilter}
            onChange={setReviewFilter}
            options={[
              { value: 'all',      label: `全部（${reviewedApps.length}）` },
              { value: 'approved', label: `已核准（${reviewedApps.filter(a => a.status === 'approved').length}）` },
              { value: 'left',     label: `已退出（${reviewedApps.filter(a => a.status === 'left').length}）` },
              { value: 'removed',  label: `已移除（${reviewedApps.filter(a => a.status === 'removed').length}）` },
              { value: 'rejected', label: `已拒絕（${reviewedApps.filter(a => a.status === 'rejected').length}）` },
            ]}
          />
        </div>
      ) : null,
      content: (
        <div className="px-5 pb-5 pt-3">
          {reviewedApps.length === 0 ? (
            <EmptyState icon={History} title="尚無審核紀錄" description="核准或拒絕申請後會顯示在這裡。" />
          ) : filteredApps.length === 0 ? (
            <EmptyState icon={History} title="沒有符合的紀錄" />
          ) : (
            <div className="space-y-3">
              {filteredApps.map(app => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  groupFull={groupFull}
                  error={errors?.[app.id]}
                  onApprove={() => {}}
                  onReject={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      ),
    }
  }

  function buildBillingPanel() {
    return {
        title: '收款管理',
        icon: <Banknote size={18} className="text-brand" />,
        content: isActivated ? (
          <div className="p-5">
            {members.length === 0 ? (
              <EmptyState icon={Banknote} title="目前尚無收款紀錄" />
            ) : (
              <div className="space-y-4">
                {members.map(m => {
                  const sub = getSubscriptionByUserAndGroup(m.userId, group.id)
                  const records = []
                  const expanded = expandedBillingMembers.has(m.id)
                  return (
                    <div key={m.id} className="overflow-hidden rounded-xl border border-line">
                      <button onClick={() => toggleBillingMember(m.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-raised">
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
          <div className="p-5">
            {members.length === 0 ? (
              <EmptyState icon={Banknote} title="目前尚無成員" />
            ) : (
              <div className="space-y-2">
                {members.map(m => {
                  const sub = getSubscriptionByUserAndGroup(m.userId, group.id)
                  const records = []
                  const expanded = expandedBillingMembers.has(m.id)
                  return (
                    <div key={m.id} className="overflow-hidden rounded-xl border border-line">
                      <button onClick={() => toggleBillingMember(m.id)} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-raised">
                        <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                        <p className="min-w-0 flex-1 text-sm font-semibold text-ink">{m.userName}</p>
                        {expanded ? <ChevronUp size={14} className="shrink-0 text-ink-3" /> : <ChevronDown size={14} className="shrink-0 text-ink-3" />}
                      </button>
                      {expanded && (
                        <div className="border-t border-line-subtle px-4 py-3 space-y-3">
                          {records.length === 0 ? (
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
        ),
      }
  }

  function buildSubPanel() {
    if (activePanel === 'members') return buildMembersPanel()
    if (activePanel === 'applications') return buildApplicationsPanel()
    if (activePanel === 'billing') return buildBillingPanel()
    return null
  }

  return (
    <>
    <GroupModalShell
      onClose={onClose}
      group={group}
      service={serviceDef}
      plan={planDef}
      hideRecruitBar={group.status !== 'recruiting'}
      headerBanner={activateGroupBanner || activateBanner || undefined}
      centeredCta={activateGroupCta || activateCta || undefined}
      extraInfoRows={[]}
      pendingBadge={group.status === 'pending_confirmation' ? '收款中' : undefined}
      statusBadgeOverride={group.status === 'pending_confirmation' ? { variant: 'pending_confirmation', label: '收款中' } : undefined}
      subPanel={activePanel ? buildSubPanel() : null}
      onSubPanelBack={() => { setActivePanel(null); setShowReviewHistory(false); setReviewFilter('all') }}
      subSubPanel={showReviewHistory && activePanel === 'applications' ? buildReviewHistoryPanel() : null}
      onSubSubPanelBack={() => { setShowReviewHistory(false); setReviewFilter('all') }}
      bottomBar={(() => {
        return (
          <div className={`grid grid-cols-${isRecruiting ? 2 : 3} gap-1 p-2`}>
            <button
              onClick={() => setActivePanel('members')}
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
            >
              <Users size={17} /> 成員名單
            </button>
            {isRecruiting ? (
              <button
                onClick={() => setActivePanel('applications')}
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
                  onClick={() => setActivePanel('billing')}
                  className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
                >
                  <Banknote size={17} />
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
      <ActivateServiceModal
        isOpen={showActivate}
        onClose={closeActivate}
        onConfirm={handleActivateConfirm}
        group={group}
        members={members}
        memberChecks={memberChecks}
        setMemberChecks={setMemberChecks}
        finalConfirmed={finalConfirmed}
        setFinalConfirmed={setFinalConfirmed}
        allMembersChecked={allMembersChecked}
        onOpenServiceIssue={m => { setServiceIssueMember(m); setServiceIssueNote(m.serviceInfoIssueNote ?? '') }}
      />

      {cancelCta}

    </GroupModalShell>

    <ReportServiceIssueModal
      member={serviceIssueMember}
      onClose={() => { setServiceIssueMember(null); setServiceIssueNote('') }}
      note={serviceIssueNote}
      setNote={setServiceIssueNote}
      onSubmit={() => {
        if (!serviceIssueNote.trim() || !serviceIssueMember) return
        onReportServiceInfoIssue?.(serviceIssueMember, serviceIssueNote.trim())
        setServiceIssueMember(null)
        setServiceIssueNote('')
      }}
    />

    {showCancelConfirm && (
      <CountdownConfirmDialog
        title="解散群組"
        message={`確定要解散「${group.serviceName}」群組嗎？所有代管費用將退還給成員，此操作無法撤回。`}
        confirmLabel="解散群組"
        danger
        onConfirm={() => { setShowCancelConfirm(false); onCancelGroup?.() }}
        onCancel={() => setShowCancelConfirm(false)}
      />
    )}

    {/* 移除成員確認（倒數 5 秒才可確認） */}
    {removingMember && (
      <CountdownConfirmDialog
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
