import { useEffect, useState } from 'react'
import { Banknote, CheckCircle2, ClipboardList, MessageCircle, PlayCircle, Radio, Trash2, Users } from 'lucide-react'
import CountdownConfirmDialog from '../../../shared/ui/CountdownConfirmDialog'
import GroupModalShell from '../../../shared/ui/GroupModalShell'
import { getServiceById } from '../../../shared/utils/serviceUtils'
import { useAuthStore } from '../../../shared/stores/useAuthStore'
import { useNotificationStore } from '../../../shared/stores/useNotificationStore'
import ActivateServiceModal from './ActivateServiceModal'
import ReportServiceIssueModal from './ReportServiceIssueModal'
import { buildMembersPanel } from './hostGroupView/buildMembersPanel'
import { buildApplicationsPanel } from './hostGroupView/buildApplicationsPanel'
import { buildReviewHistoryPanel } from './hostGroupView/buildReviewHistoryPanel'
import { buildBillingPanel } from './hostGroupView/buildBillingPanel'

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

  function buildSubPanel() {
    if (activePanel === 'members') return buildMembersPanel({ group, members, appByMemberId, setActivePanel, onClose, setRemovingMember })
    if (activePanel === 'applications') return buildApplicationsPanel({ pendingApps, groupFull, errors, onApprove, onReject, setActivePanel, setShowReviewHistory })
    if (activePanel === 'billing') return buildBillingPanel({ isActivated, members, expandedBillingMembers, toggleBillingMember })
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
      subSubPanel={showReviewHistory && activePanel === 'applications' ? buildReviewHistoryPanel({ applications, reviewFilter, setReviewFilter, groupFull, errors }) : null}
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
