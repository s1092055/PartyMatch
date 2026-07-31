import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGroupStore } from '../../common/stores/useGroupStore'
import { getServiceById } from '../../common/utils/serviceUtils'
import { hasFilledServiceInfo } from '../../common/utils/serviceInfoFields'
import { useApplicationStore } from '../../common/stores/useApplicationStore'
import { useMemberStore } from '../../common/stores/useMemberStore'
import { useFavoriteStore } from '../../common/stores/useFavoriteStore'
import { useAuthStore } from '../../common/stores/useAuthStore'
import { finalizeLeaveGroup } from './utils/leaveGroupFlow'
import { calcDisplayPrice } from '../../common/utils/pricingUtils'
import { toast } from '../../common/utils/toast'
import { TokenBadge } from '../../components/ui/TokenAmount'
import ConfirmActionDialog from '../../components/ui/ConfirmActionDialog'
import GroupModalShell from '../../components/ui/group/GroupModalShell'
import FavoriteToggleButton from '../../components/ui/FavoriteToggleButton'
import MemberGroupView from '../subscriptions/components/MemberGroupView'
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
  const picksScrollRef = useRef(null)
  const [picksAtStart, setPicksAtStart] = useState(true)
  const [picksAtEnd, setPicksAtEnd]     = useState(true)

  function scrollPicks(delta) {
    picksScrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' })
  }

  function handlePicksScroll(e) {
    const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget
    setPicksAtStart(scrollLeft <= 0)
    setPicksAtEnd(scrollLeft + clientWidth >= scrollWidth - 1)
  }

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

  const memberRecord        = group && activeUserId ? (members.find(m => m.userId === activeUserId && m.groupId === group.id) ?? null) : null
  const hasServiceInfoIssue = !!memberRecord?.serviceInfoIssueNote
  const hasServiceInfo      = hasFilledServiceInfo(memberRecord?.serviceInfo, service?.sharingMethod) && !hasServiceInfoIssue

  const picks = useMemo(() => {
    if (!group) return []
    const recruiting = groups.filter(g => g.status === 'recruiting' && g.openSeats > 0 && g.id !== group.id && g.hostId !== activeUserId)
    return [
      ...recruiting.filter(g => g.serviceId === group.serviceId),
      ...recruiting.filter(g => g.serviceId !== group.serviceId),
    ]
  }, [group, groups, activeUserId])

  useEffect(() => {
    const el = picksScrollRef.current
    if (!el) return
    setPicksAtStart(true)
    setPicksAtEnd(el.scrollWidth <= el.clientWidth)
  }, [picks])

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
  const isPaymentPhase      = ['pending_confirmation', 'pending_activation', 'active'].includes(group.status)
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

  // 點「申請加入」當下就先比對餘額，不足就直接引導儲值，不用等填完留言表單送出才被後端擋下來
  function handleApplyClick() {
    const price = calcDisplayPrice(group.pricePerSeat, group.billingCycle)
    const balance = activeUser?.tokenBalance ?? 0
    if (price > balance) {
      toast('PM幣不足', 'error', {
        icon: <TokenBadge />,
        action: { label: '前往儲值', onClick: () => window.dispatchEvent(new CustomEvent('pm:open-topup')) },
      })
      return
    }
    setShowApply(true)
  }

  async function handleWithdraw() {
    if (withdrawing || !app) return
    setWithdrawing(true)
    try {
      await useApplicationStore.getState().withdraw(app.id)
      setWithdrawConfirm(false)
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? '撤回申請失敗，請稍後再試'
      toast(msg, 'error')
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
        toast('PM幣不足', 'error', {
          icon: <TokenBadge />,
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
    else navigate('/login')
  }

  // 已經是成員時，不管從哪個入口（探索頁、訊息、儲值紀錄…）打開群組詳情，
  // 一律統一顯示跟「我的訂閱」/「群組管理」同一份內容，不要讓同一個群組在不同入口看到不同版本
  if (isMember && !isHost) {
    return <MemberGroupView group={group} onLeaveGroup={handleLeave} onClose={handleClose} />
  }

  const reviews = (
    <HostReviews
      group={group}
      headerClassName="text-lg font-black text-brand"
      onDm={activeUserId && !isHost ? openDm : undefined}
      scrollable
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
      statusBadgeOverride={
        isMember && group.status === 'recruiting' ? 'member_joined' :
        isPendingApp ? { variant: 'pending', label: '審核中' } :
        undefined
      }
      subPanel={showMembers ? buildMembersSubPanel({ group, groupId, members, activeUserId, setShowMembers, openDm }) : null}
      onSubPanelBack={() => { setShowMembers(false); resetApply() }}
      panelKey={showMembers ? 'members' : 'overview'}
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
        <FavoriteToggleButton isFav={isFav} onClick={toggleFav} heartSize={19} className="mt-1 h-8 w-8" />
      }
      mobileReviewsSection={reviews}
      mobileFooter={buildMobileFooter({
        group, activeUserId, navigate, handleClose,
        isHost, isWaitingMembers, needsFillInfo, hasServiceInfoIssue,
        isMember, isPendingApp, isFull, canApply, isFav,
        withdrawConfirm, setWithdrawConfirm, withdrawing, handleWithdraw,
        setShowMembers, setLeaveConfirm, onApplyClick: handleApplyClick, toggleFav,
      })}
      afterColumns={picks.length > 0 && (
        <div className="border-t border-line px-6 pb-4 pt-5">
          <h3 className="mb-4 text-lg font-black text-brand">其他推薦群組</h3>
          <div className="relative">
            {!picksAtStart && (
              <button
                type="button"
                onClick={() => scrollPicks(-280)}
                aria-label="往左看更多"
                className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-canvas text-ink-3 shadow-md transition-colors hover:bg-raised hover:text-ink md:grid"
              >
                <ChevronLeft size={16} strokeWidth={1.5} />
              </button>
            )}
            <div
              ref={picksScrollRef}
              onScroll={handlePicksScroll}
              className="flex gap-3 overflow-x-auto px-2 pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {picks.map(g => (
                <div key={g.id} className="w-64 shrink-0">
                  <ExploreGroupCard group={g} isApplied={appliedGroupIds.has(g.id)} isMember={memberGroupIds.has(g.id)} />
                </div>
              ))}
            </div>
            {!picksAtEnd && (
              <button
                type="button"
                onClick={() => scrollPicks(280)}
                aria-label="往右看更多"
                className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 translate-x-1/2 place-items-center rounded-full border border-line bg-canvas text-ink-3 shadow-md transition-colors hover:bg-raised hover:text-ink md:grid"
              >
                <ChevronRight size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      )}
    >
    </GroupModalShell>}

    {/* 退出確認 */}
    {leaveConfirm && (
      <ConfirmActionDialog
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
