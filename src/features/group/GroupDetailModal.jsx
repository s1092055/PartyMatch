import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Heart } from 'lucide-react'
import { useGroupStore } from '../../shared/stores/useGroupStore'
import { getServiceById } from '../../shared/utils/serviceUtils'
import { useApplicationStore } from '../../shared/stores/useApplicationStore'
import { useMemberStore } from '../../shared/stores/useMemberStore'
import { useFavoriteStore } from '../../shared/stores/useFavoriteStore'
import { useAuthStore } from '../../shared/stores/useAuthStore'
import { finalizeLeaveGroup } from './utils/leaveGroupFlow'
import { toast } from '../../shared/utils/toast'
import CountdownConfirmDialog from '../../shared/ui/CountdownConfirmDialog'
import GroupModalShell from '../../shared/ui/GroupModalShell'
import ExploreGroupCard from '../explore/components/ExploreGroupCard'
import HostReviews from './components/HostReviews'
import ApplyModal from './components/ApplyModal'
import { buildMembersSubPanel } from './components/buildMembersSubPanel'
import { buildMobileFooter } from './components/buildMobileFooter'

export default function GroupDetailModal() {
  const navigate = useNavigate()
  const [groupId, setGroupId]               = useState(null)
  const [showApply, setShowApply]           = useState(false)
  const [applyMessage, setApplyMessage]     = useState('')
  const [applyAgreed, setApplyAgreed]       = useState(false)
  const [applySubmitted, setApplySubmitted] = useState(false)
  const [showMembers, setShowMembers]           = useState(false)
  const [leaveConfirm, setLeaveConfirm]         = useState(false)
  const [withdrawConfirm, setWithdrawConfirm]   = useState(false)
  const [withdrawing, setWithdrawing]           = useState(false)
  const [applying, setApplying]                 = useState(false)

  const isOpen       = !!groupId
  const activeUser   = useAuthStore(s => s.user)
  const activeUserId = activeUser?.id

  // 訂閱 store 切片，群組/申請/成員/收藏更新時自動重新渲染
  const groups       = useGroupStore(s => s.groups)
  const applications = useApplicationStore(s => s.applications)
  const members      = useMemberStore(s => s.members)
  const isFav        = useFavoriteStore(s => groupId && activeUserId ? s.isFavorited(activeUserId, groupId) : false)

  function resetApply() {
    setShowApply(false); setApplyMessage(''); setApplyAgreed(false); setApplySubmitted(false)
  }

  useEffect(() => {
    function onOpen(e) {
      setGroupId(e.detail?.groupId ?? null)
      resetApply()
    }
    window.addEventListener('pm:open-group', onOpen)
    return () => window.removeEventListener('pm:open-group', onOpen)
  }, [])

  const group   = isOpen ? (groups.find(g => g.id === groupId) ?? null) : null
  const service = group ? getServiceById(group.serviceId) : null
  const plan    = service?.plans.find(p => p.name === group?.planName)

  const picks = useMemo(() => {
    if (!group) return []
    const recruiting = groups.filter(g => g.status === 'recruiting' && g.openSeats > 0 && g.id !== group.id && g.hostId !== activeUserId)
    return [
      ...recruiting.filter(g => g.serviceId === group.serviceId),
      ...recruiting.filter(g => g.serviceId !== group.serviceId),
    ]
  }, [group, groups, activeUserId])

  const memberGroupIds  = useMemo(
    () => new Set(members.filter(m => m.userId === activeUserId).map(m => m.groupId)),
    [members, activeUserId],
  )
  const appliedGroupIds = useMemo(
    () => activeUserId
      ? new Set(applications.filter(a => (a.applicantId ?? a.userId) === activeUserId && a.status === 'pending').map(a => a.groupId))
      : new Set(),
    [applications, activeUserId],
  )

  if (!isOpen || !group) return null

  const isHost           = group.hostId === activeUserId
  const isMember         = activeUserId ? members.some(m => m.userId === activeUserId && m.groupId === group.id) : false
  const memberRecord     = activeUserId ? (members.find(m => m.userId === activeUserId && m.groupId === group.id) ?? null) : null
  const isPaymentPhase      = ['pending_confirmation', 'pending_activation', 'active'].includes(group.status)
  const hasServiceInfoIssue = !!memberRecord?.serviceInfoIssueNote
  const hasServiceInfo      = !!memberRecord?.serviceInfo?.email && !hasServiceInfoIssue
  const needsFillInfo       = isMember && isPaymentPhase && !hasServiceInfo
  const isWaitingMembers = isMember && ['recruiting', 'full'].includes(group.status)
  const isFull           = (group.openSeats ?? 0) <= 0

  // 直接從 store 讀取申請狀態，避免 state 在審核過渡期間不一致
  // approved && !isMember → false，確保退出後可重新申請
  const app          = activeUserId ? useApplicationStore.getState().getByUserAndGroup(activeUserId, group.id) : null
  const appStatus    = app?.status
  const hasActiveApp = !!app && appStatus !== 'rejected' && appStatus !== 'removed' && appStatus !== 'left' && appStatus !== 'withdrawn' && !(appStatus === 'approved' && !isMember)
  const isPendingApp = appStatus === 'pending'

  const canApply = !isHost && !isMember && !hasActiveApp && !isFull && !!activeUserId

  function handleClose() { setGroupId(null); setShowMembers(false); setLeaveConfirm(false); setWithdrawConfirm(false); resetApply() }

  async function handleWithdraw() {
    if (withdrawing || !app) return
    setWithdrawing(true)
    try {
      await useApplicationStore.getState().withdraw(app.id)
      setWithdrawConfirm(false)
    } finally {
      setWithdrawing(false)
    }
  }

  async function handleApply() {
    if (!applyAgreed || applying) return
    setApplying(true)
    try {
      await useApplicationStore.getState().create({
        groupId: group.id,
        groupName: group.groupName || group.serviceName,
        serviceId: group.serviceId,
        serviceName: group.serviceName,
        planName: group.planName,
        hostId: group.hostId,
        hostName: group.hostName,
        hostAvatarInitial: group.hostAvatarInitial,
        hostAvatarColor: group.hostAvatarColor,
        message: applyMessage,
      }, useAuthStore.getState().getProfile())
      setApplySubmitted(true)
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? '申請失敗，請稍後再試'
      if (err?.response?.data?.code === 'INSUFFICIENT_BALANCE') {
        toast('代幣不足', 'error', {
          action: { label: '前往儲值', onClick: () => window.dispatchEvent(new CustomEvent('pm:open-topup')) },
        })
      } else {
        toast(msg, 'error')
      }
    } finally {
      setApplying(false)
    }
  }

  function handleLeave() {
    setLeaveConfirm(false)
    handleClose()
    finalizeLeaveGroup(
      groupId,
      { id: activeUserId, name: activeUser?.name ?? activeUser?.displayName ?? '成員' },
    ).catch(console.error)
  }
  function openDm() {
    handleClose()
    window.dispatchEvent(new CustomEvent('pm:open-dm', {
      detail: { hostId: group.hostId, hostName: group.hostName, hostAvatarInitial: group.hostAvatarInitial, hostAvatarColor: group.hostAvatarColor },
    }))
  }
  function toggleFav() {
    if (activeUserId) useFavoriteStore.getState().toggle(activeUserId, group.id)
    else navigate(`/login?redirectTo=/groups/${group.id}`)
  }

  const reviews = (
    <HostReviews
      group={group}
      headerClassName="text-lg font-black text-brand"
      onDm={activeUserId && !isHost ? openDm : undefined}
    />
  )

  return (
    <>
    {/* 申請加入 sub-modal — 開啟時隱藏後方的群組詳情 */}
    <ApplyModal
      group={group}
      isOpen={showApply}
      onClose={resetApply}
      applyMessage={applyMessage}
      setApplyMessage={setApplyMessage}
      applyAgreed={applyAgreed}
      setApplyAgreed={setApplyAgreed}
      applySubmitted={applySubmitted}
      applying={applying}
      onApply={handleApply}
    />

    {/* 群組詳情 modal — 申請 sub-modal 開啟時隱藏 */}
    {!showApply && <GroupModalShell
      onClose={handleClose}
      group={group}
      service={service}
      plan={plan}
      hideRecruitBar={isMember || isHost || group.status !== 'recruiting'}
      extraInfoRows={[]}
      statusBadgeOverride={isMember && group.status === 'recruiting' ? 'member_joined' : undefined}
      subPanel={showMembers ? buildMembersSubPanel({ group, groupId, members, activeUserId, setShowMembers, openDm }) : null}
      onSubPanelBack={() => { setShowMembers(false); resetApply() }}
      headerBanner={
        isWaitingMembers ? (
          <div className="flex items-center justify-center gap-2 bg-success-subtle px-6 py-3 text-sm font-medium text-success-text">
            <CheckCircle2 size={15} />
            {group.status === 'full' ? '招募完成，等待團主鎖定群組' : '已通過申請，需等待其他人加入'}
          </div>
        ) : isPendingApp ? (
          <div className="flex items-center justify-center gap-2 bg-warning-subtle px-6 py-3 text-sm font-medium text-warning-text">
            <CheckCircle2 size={15} />已送出申請，等待團主審核
          </div>
        ) : undefined
      }
      summaryFavoriteSlot={
        <button
          onClick={toggleFav}
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-raised"
          aria-label={isFav ? '取消收藏' : '加入收藏'}
        >
          <Heart size={19} className={isFav ? 'fill-red-500 text-red-500' : 'text-ink-4'} />
        </button>
      }
      mobileReviewsSection={reviews}
      mobileFooter={buildMobileFooter({
        group, activeUserId, navigate, handleClose,
        isHost, isWaitingMembers, needsFillInfo, hasServiceInfoIssue,
        isMember, isPendingApp, isFull, canApply, isFav,
        withdrawConfirm, setWithdrawConfirm, withdrawing, handleWithdraw,
        setShowMembers, setLeaveConfirm, setShowApply, toggleFav,
      })}
      afterColumns={picks.length > 0 && (
        <div className="border-t border-line px-6 pb-4 pt-5">
          <h3 className="mb-4 text-lg font-black text-brand">其他推薦群組</h3>
          <div className="flex gap-3 overflow-x-auto px-0.5 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {picks.map(g => (
              <div key={g.id} className="w-64 shrink-0">
                <ExploreGroupCard group={g} isApplied={appliedGroupIds.has(g.id)} isMember={memberGroupIds.has(g.id)} />
              </div>
            ))}
          </div>
        </div>
      )}
    >
    </GroupModalShell>}

    {/* 退出確認 */}
    {leaveConfirm && (
      <CountdownConfirmDialog
        title="確認退出群組？"
        message={`退出後將釋出名額，需重新申請才能加入「${group?.serviceName}」。`}
        confirmLabel="退出群組"
        danger
        onConfirm={handleLeave}
        onCancel={() => setLeaveConfirm(false)}
      />
    )}
    </>
  )
}
