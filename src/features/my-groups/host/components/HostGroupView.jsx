import { useEffect, useState } from 'react'
import { Banknote, CheckCircle2, ClipboardList, Clock, Info, MessageCircle, Package, PlayCircle, Radio, RefreshCw, Star, Trash2, Users } from 'lucide-react'
import CountdownConfirmDialog from '../../../../shared/ui/primitives/CountdownConfirmDialog'
import CountdownText from '../../../../shared/ui/primitives/CountdownText'
import GroupModalShell from '../../../../shared/ui/group/GroupModalShell'
import GroupModalSideBarItem from '../../../../shared/ui/group/GroupModalSideBarItem'
import ServiceContentPanel from '../../../../shared/ui/group/ServiceContentPanel'
import HostReviews from '../../../group/components/HostReviews'
import { getServiceById } from '../../../../shared/utils/serviceUtils'
import { useAuthStore } from '../../../../shared/stores/useAuthStore'
import { useNotificationStore } from '../../../../shared/stores/useNotificationStore'
import { fetchGroupTransactions } from '../../../../shared/api/groupsApi'
import ActivateServiceModal from './ActivateServiceModal'
import ReportServiceIssueModal from './ReportServiceIssueModal'
import { buildMembersPanel } from './hostGroupView/buildMembersPanel'
import { buildApplicationsPanel } from './hostGroupView/buildApplicationsPanel'
import { buildReviewHistoryPanel } from './hostGroupView/buildReviewHistoryPanel'
import { buildBillingPanel } from './hostGroupView/buildBillingPanel'

// ── 團主視角 ──────────────────────────────────────────────────────────────────

export default function HostGroupView({ group, members, applications, onReportServiceInfoIssue, onRemoveMember, onActivate, onLockGroup, onCancelGroup, onApprove, onReject, errors, onClose, autoOpenLockGroup, autoOpenActivate, onAutoOpenActivateDone, autoOpenApplications, autoOpenBilling, onOpenRenewal }) {
  const [showActivate, setShowActivate]                   = useState(false)
  const [removingMember, setRemovingMember]               = useState(null)
  const [activePanel, setActivePanel]                     = useState(null) // 'members' | 'serviceContent' | 'applications' | 'billing' | null
  const [showReviewHistory, setShowReviewHistory]         = useState(false)
  const [reviewFilter, setReviewFilter]                   = useState('all')
  const [showLockGroupConfirm, setShowLockGroupConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm]         = useState(false)
  const [expandedBillingMembers, setExpandedBillingMembers] = useState(new Set())
  const [transactions, setTransactions]                     = useState([])
  const [transactionsLoading, setTransactionsLoading]       = useState(false)

  useEffect(() => {
    if (activePanel !== 'billing') return
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTransactionsLoading(true)
    fetchGroupTransactions(group.id)
      .then(data => { if (active) setTransactions(data) })
      .catch(() => { if (active) setTransactions([]) })
      .finally(() => { if (active) setTransactionsLoading(false) })
    return () => { active = false }
  }, [activePanel, group.id])

  function toggleBillingMember(memberId) {
    setExpandedBillingMembers(prev => {
      const next = new Set(prev)
      next.has(memberId) ? next.delete(memberId) : next.add(memberId)
      return next
    })
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoOpenLockGroup && group.status === 'full') setShowLockGroupConfirm(true)
  }, [autoOpenLockGroup]) // eslint-disable-line react-hooks/exhaustive-deps

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
  const pendingApps   = applications.filter(a => a.status === 'pending')
  const groupFull     = group.openSeats <= 0

  const canActivateNow  = group.status === 'pending_activation'

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

  const lockGroupBanner = group.status === 'full' && (
    <div className="flex items-center justify-center bg-success-subtle px-6 py-3 text-sm font-extrabold text-success-text">
      招募完成，請點擊鎖定群組
    </div>
  )

  const lockGroupCta = group.status === 'full' && (
    <div className="py-2">
      {showLockGroupConfirm ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowLockGroupConfirm(false)}
            className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink-2 transition-colors hover:bg-raised"
          >取消</button>
          <button
            onClick={() => { setShowLockGroupConfirm(false); onLockGroup?.() }}
            className="rounded-xl bg-success px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-success-text"
          >確認鎖定</button>
        </div>
      ) : (
        <button
          onClick={() => setShowLockGroupConfirm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-success px-6 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-success-text"
        >
          <Radio size={15} /> 鎖定群組
        </button>
      )}
    </div>
  )

  const pendingConfirmationBanner = group.status === 'pending_confirmation' && (
    <div className="flex items-center justify-center gap-2 bg-info-subtle px-6 py-3 text-sm font-extrabold text-info-text">
      <Clock size={15} strokeWidth={1.5} />
      等待成員填寫服務帳號資訊
      {group.serviceInfoDeadline && (
        <>，剩餘 <CountdownText deadline={group.serviceInfoDeadline} /></>
      )}
    </div>
  )

  const confirmingBanner = group.status === 'confirming' && (
    <div className="flex items-center justify-center gap-2 bg-info-subtle px-6 py-3 text-sm font-extrabold text-info-text">
      <Clock size={15} strokeWidth={1.5} />
      確認期進行中
      {group.confirmDeadline && (
        <>，剩餘 <CountdownText deadline={group.confirmDeadline} /></>
      )}
    </div>
  )

  const activateBanner = canActivateNow && (
    <div className="flex items-center justify-center gap-2 bg-success-subtle px-6 py-3 text-sm font-extrabold text-success-text">
      <CheckCircle2 size={15} />
      所有付款已確認，可以啟用服務了
    </div>
  )

  const activateCta = canActivateNow && (
    <div className="py-2">
      <button
        onClick={openActivate}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-success px-6 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-success-text"
      >
        <PlayCircle size={15} /> 啟用服務
      </button>
    </div>
  )

  const isRecruiting = ['recruiting', 'full'].includes(group.status)

  function buildSubPanel() {
    if (activePanel === 'members') return buildMembersPanel({ group, members, setActivePanel, onClose, setRemovingMember })
    if (activePanel === 'serviceContent') return { content: <ServiceContentPanel group={group} service={serviceDef} plan={planDef} /> }
    if (activePanel === 'applications') return buildApplicationsPanel({ pendingApps, groupFull, errors, onApprove, onReject, setActivePanel, setShowReviewHistory })
    if (activePanel === 'billing') return buildBillingPanel({ members, transactions, transactionsLoading, expandedBillingMembers, toggleBillingMember })
    if (activePanel === 'reviews') return { content: <div className="px-5"><HostReviews group={group} headerClassName="text-lg font-black text-brand" /></div> }
    return null
  }

  const isReviewHistory = showReviewHistory && activePanel === 'applications'

  // 側邊欄一律視為「換到別的分頁」，一併離開審核紀錄，避免之後再點回申請管理時卡在審核紀錄出不去
  function goToPanel(panel) {
    setActivePanel(panel)
    setShowReviewHistory(false)
    setReviewFilter('all')
  }

  function renderSideBar() {
    const showRenewal = group.status === 'active'
    return (
      <>
        <GroupModalSideBarItem active={activePanel === null} onClick={() => goToPanel(null)}>
          <Info size={17} /> 群組概覽
        </GroupModalSideBarItem>
        <GroupModalSideBarItem active={activePanel === 'serviceContent'} onClick={() => goToPanel('serviceContent')}>
          <Package size={17} /> 服務內容
        </GroupModalSideBarItem>
        <GroupModalSideBarItem active={activePanel === 'members'} onClick={() => goToPanel('members')}>
          <Users size={17} /> 成員名單
        </GroupModalSideBarItem>
        <GroupModalSideBarItem active={activePanel === 'reviews'} onClick={() => goToPanel('reviews')}>
          <Star size={17} /> 我的評價
        </GroupModalSideBarItem>
        {isRecruiting ? (
          <>
            <GroupModalSideBarItem
              active={activePanel === 'applications' && !isReviewHistory}
              onClick={() => goToPanel('applications')}
              className="relative"
            >
              <span className="relative">
                <ClipboardList size={17} />
                {pendingApps.length > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning-text px-0.5 text-2xs font-bold text-white">
                    {pendingApps.length}
                  </span>
                )}
              </span>
              申請管理
            </GroupModalSideBarItem>
            <GroupModalSideBarItem pinned tone="danger" onClick={() => setShowCancelConfirm(true)}>
              <Trash2 size={17} /> 解散群組
            </GroupModalSideBarItem>
          </>
        ) : (
          <>
            <GroupModalSideBarItem active={activePanel === 'billing'} onClick={() => goToPanel('billing')}>
              <Banknote size={17} />
              收款管理
            </GroupModalSideBarItem>
            {showRenewal && (
              <GroupModalSideBarItem onClick={() => onOpenRenewal?.()}>
                <RefreshCw size={17} /> 續訂管理
              </GroupModalSideBarItem>
            )}
            <GroupModalSideBarItem
              pinned
              onClick={() => {
                onClose()
                window.dispatchEvent(new CustomEvent('pm:open-messages', { detail: { groupId: group.id } }))
              }}
            >
              <MessageCircle size={17} /> 群組訊息
            </GroupModalSideBarItem>
          </>
        )}
      </>
    )
  }

  return (
    <>
    <GroupModalShell
      onClose={onClose}
      group={group}
      service={serviceDef}
      plan={planDef}
      hideServiceIntro
      hideRecruitBar={group.status !== 'recruiting'}
      headerBanner={lockGroupBanner || activateBanner || pendingConfirmationBanner || confirmingBanner || undefined}
      centeredCta={lockGroupCta || activateCta || undefined}
      extraInfoRows={[]}
      pendingBadge={group.status === 'pending_confirmation' ? '收款中' : undefined}
      statusBadgeOverride={group.status === 'pending_confirmation' ? { variant: 'pending_confirmation', label: '收款中' } : undefined}
      subPanel={activePanel ? buildSubPanel() : null}
      onSubPanelBack={() => { setActivePanel(null); setShowReviewHistory(false); setReviewFilter('all') }}
      subSubPanel={isReviewHistory ? buildReviewHistoryPanel({ applications, reviewFilter, setReviewFilter, groupFull, errors }) : null}
      onSubSubPanelBack={() => { setShowReviewHistory(false); setReviewFilter('all') }}
      panelKey={isReviewHistory ? 'reviewHistory' : activePanel ?? 'overview'}
      sideBar={renderSideBar()}
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
    </GroupModalShell>

    <ReportServiceIssueModal
      member={serviceIssueMember}
      sharingMethod={serviceDef?.sharingMethod}
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
