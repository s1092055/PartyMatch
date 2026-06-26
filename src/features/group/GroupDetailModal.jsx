import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, ChevronRight,
  CreditCard, Heart, LogIn, LogOut, MessageCircle, Shield, ShieldCheck, Star, Users,
} from 'lucide-react'
import { getGroupById, getGroups } from '../../shared/stores/groupStore'
import { getServiceById } from '../../shared/utils/serviceUtils'
import { getApplicationByUserAndGroup, getApplicationsByUserId } from '../../shared/stores/applicationStore'
import { isCurrentUserMember, getMemberByUserAndGroup, getMembersByGroupId, getMemberGroupIds } from '../../shared/stores/memberStore'
import { isGroupFavorited, toggleFavorite } from '../../shared/stores/favoriteStore'
import { getCurrentUser } from '../../shared/stores/authStore'
import { scheduleLeaveGroup } from '../../shared/utils/leaveGroupFlow'
import { toast } from '../../shared/utils/toast'
import Avatar from '../../shared/ui/Avatar'
import Button from '../../shared/ui/Button'
import Modal from '../../shared/ui/Modal'
import ConfirmDialog from '../../shared/ui/ConfirmDialog'
import GroupModalShell from '../../shared/ui/GroupModalShell'
import ApplyJoinModal from './components/ApplyJoinModal'
import ExploreGroupCard from '../explore/components/ExploreGroupCard'

// ── 團主評價 ──────────────────────────────────────────────────────────────────

function HostReviews({ group, hostStars, headerClassName, onDm }) {
  return (
    <div className="space-y-4 py-5">
      <p className={headerClassName}>團主評價</p>
      <div className="flex items-center gap-3 border-b border-line-subtle pb-4">
        <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{group.hostName}（團主）</p>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={12} className={i < hostStars ? 'fill-amber-400 text-amber-400' : 'text-line'} />
              ))}
            </div>
            {(group.hostReviewCount ?? 0) > 0 && (
              <span className="text-xs text-ink-4">{group.hostReviewCount} 則評價</span>
            )}
          </div>
        </div>
        {onDm && (
          <button
            onClick={onDm}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink-3 transition-colors hover:border-brand hover:text-brand"
            aria-label="聯絡團主"
          >
            <MessageCircle size={16} />
          </button>
        )}
      </div>
      {(group.reviews ?? []).length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-4">尚無評價</p>
      ) : (
        (group.reviews ?? []).map(review => (
          <div key={review.id} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-bold text-ink-2">
              {review.author?.[0] ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">{review.author}</span>
                <span className="text-xs text-ink-4">{review.date}</span>
              </div>
              {review.rating != null && (
                <div className="mb-1 flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={11} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-line'} />
                  ))}
                </div>
              )}
              <p className="text-sm leading-relaxed text-ink-3">{review.comment}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ── 主元件 ────────────────────────────────────────────────────────────────────

export default function GroupDetailModal() {
  const navigate = useNavigate()
  const [groupId, setGroupId]               = useState(null)
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [isFav, setIsFav]                   = useState(false)
  const [tick, setTick]                     = useState(0)
  const [showMembers, setShowMembers]       = useState(false)
  const [leaveConfirm, setLeaveConfirm]     = useState(false)

  const isOpen       = !!groupId
  const activeUser   = getCurrentUser()
  const activeUserId = activeUser?.id

  useEffect(() => {
    function onGroupsChanged() { setTick(t => t + 1) }
    window.addEventListener('pm:groups-changed', onGroupsChanged)
    return () => window.removeEventListener('pm:groups-changed', onGroupsChanged)
  }, [])

  useEffect(() => {
    function onStoreChanged() { setTick(t => t + 1) }
    window.addEventListener('pm:applications-changed', onStoreChanged)
    window.addEventListener('pm:members-changed', onStoreChanged)
    return () => {
      window.removeEventListener('pm:applications-changed', onStoreChanged)
      window.removeEventListener('pm:members-changed', onStoreChanged)
    }
  }, [])

  useEffect(() => {
    function onOpen(e) {
      const gId = e.detail?.groupId ?? null
      setGroupId(gId)
      setApplyModalOpen(false)
      setIsFav(gId && activeUserId ? isGroupFavorited(activeUserId, gId) : false)
    }
    window.addEventListener('pm:open-group', onOpen)
    return () => window.removeEventListener('pm:open-group', onOpen)
  }, [activeUserId])

  const group   = isOpen ? getGroupById(groupId) : null
  const service = group ? getServiceById(group.serviceId) : null
  const plan    = service?.plans.find(p => p.name === group?.planName)

  const picks = useMemo(() => {
    if (!group) return []
    const recruiting = getGroups().filter(g => g.status === 'recruiting' && g.openSeats > 0 && g.id !== group.id && g.hostId !== activeUserId)
    return [
      ...recruiting.filter(g => g.serviceId === group.serviceId),
      ...recruiting.filter(g => g.serviceId !== group.serviceId),
    ]
  }, [groupId, activeUserId, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  const memberGroupIds  = activeUserId ? getMemberGroupIds(activeUserId) : []
  const appliedGroupIds = activeUserId
    ? new Set(getApplicationsByUserId(activeUserId).filter(a => a.status === 'pending').map(a => a.groupId))
    : new Set()

  if (!isOpen || !group) return null

  const isHost           = group.hostId === activeUserId
  const isMember         = isCurrentUserMember(group.id)
  const memberRecord     = activeUserId ? getMemberByUserAndGroup(activeUserId, group.id) : null
  const isPaymentPhase      = ['pending_confirmation', 'pending_activation', 'active'].includes(group.status)
  const hasServiceInfoIssue = !!memberRecord?.serviceInfoIssueNote
  const hasServiceInfo      = !!memberRecord?.serviceInfo?.email && !hasServiceInfoIssue
  const needsFillInfo       = isMember && isPaymentPhase && !hasServiceInfo
  const isPendingPayment    = isMember && ['pending', 'payment_failed'].includes(memberRecord?.paymentStatus) && isPaymentPhase && hasServiceInfo
  const hasPaymentFailed    = memberRecord?.paymentStatus === 'payment_failed'
  const isMarkedPaid     = isMember && memberRecord?.paymentStatus === 'markedPaid' && isPaymentPhase
  const isWaitingMembers = isMember && ['recruiting', 'full'].includes(group.status)
  const isFull           = (group.openSeats ?? 0) <= 0

  // 直接從 store 讀取申請狀態，避免 state 在審核過渡期間不一致
  // approved && !isMember → false，確保退出後可重新申請
  const app          = activeUserId ? getApplicationByUserAndGroup(activeUserId, group.id) : null
  const appStatus    = app?.status
  const hasActiveApp = !!app && appStatus !== 'rejected' && appStatus !== 'removed' && !(appStatus === 'approved' && !isMember)
  const isPendingApp = appStatus === 'pending'

  const canApply = !isHost && !isMember && !hasActiveApp && !isFull && !!activeUserId

  function handleClose() { setGroupId(null); setShowMembers(false); setLeaveConfirm(false) }

  function handleLeave() {
    setLeaveConfirm(false)
    scheduleLeaveGroup({
      conversationId: `group_${groupId}`,
      groupId,
      user: { id: activeUserId, name: activeUser?.name ?? activeUser?.displayName ?? '成員' },
      groupName: group.serviceName,
      onScheduled: handleClose,
    })
  }
  function openDm() {
    handleClose()
    window.dispatchEvent(new CustomEvent('pm:open-dm', {
      detail: { hostId: group.hostId, hostName: group.hostName, hostAvatarInitial: group.hostAvatarInitial, hostAvatarColor: group.hostAvatarColor },
    }))
  }
  function toggleFav() {
    if (activeUserId) setIsFav(toggleFavorite(activeUserId, group.id))
    else navigate(`/login?redirectTo=/groups/${group.id}`)
  }

  function renderCTA() {
    if (!activeUserId) return (
      <Button variant="primary" size="lg" className="w-full"
        onClick={() => navigate(`/login?redirectTo=/groups/${group.id}`)}>
        <LogIn size={16} />登入以加入群組
      </Button>
    )
    if (isHost) return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-brand-subtle px-4 py-3 text-sm font-medium text-brand">
        <ShieldCheck size={15} />你是此群組的團主
      </div>
    )
    if (isWaitingMembers) return null
    if (needsFillInfo || isPendingPayment) return (
      <div className="flex justify-center">
        <div className="relative w-full">
          <span className={`absolute inset-1 rounded-xl animate-ping opacity-20 ${(hasPaymentFailed || hasServiceInfoIssue) ? 'bg-danger' : 'bg-brand'}`} />
          <button
            onClick={() => {
              handleClose()
              navigate('/my-subscriptions', { state: { openGroupId: group.id, ...(isPendingPayment ? { openPayment: true } : {}) } })
            }}
            className={`relative flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-colors ${
              (hasPaymentFailed || hasServiceInfoIssue) ? 'bg-danger hover:opacity-90' : 'bg-brand hover:bg-brand-hover'
            }`}
          >
            <CreditCard size={15} />
            {hasServiceInfoIssue ? '修正服務帳號' : needsFillInfo ? '填寫服務帳號' : hasPaymentFailed ? '重新上傳付款憑證' : '前往付款'}
          </button>
        </div>
      </div>
    )
    if (isMarkedPaid) return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-purple-subtle px-4 py-3 text-sm font-medium text-purple-text">
        <CheckCircle2 size={15} />已付款，等待團主確認
      </div>
    )
    if (isMember) return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-success-subtle px-4 py-3 text-sm font-medium text-success-text">
        <CheckCircle2 size={15} />已加入此群組
      </div>
    )
    if (isFull) return (
      <Button variant="ghost" size="lg" className="w-full border border-line" disabled>已額滿</Button>
    )
    if (hasActiveApp) return null
    return null
  }

  const hostStars = group.hostRating != null ? Math.round(group.hostRating / 20) : 0
  const reviews   = (
    <HostReviews
      group={group}
      hostStars={hostStars}
      headerClassName="text-lg font-black text-brand"
      onDm={activeUserId && !isHost ? openDm : undefined}
    />
  )

  return (
    <>
    <GroupModalShell
      onClose={handleClose}
      group={group}
      service={service}
      plan={plan}
      hideRecruitBar={isMember || isHost || group.status !== 'recruiting'}
      extraInfoRows={[
        ...(group.paymentMethod ? [{ label: '付款方式', value: group.paymentMethod }] : []),
      ]}
      statusBadgeOverride={isMember && group.status === 'recruiting' ? 'member_joined' : undefined}
      headerBanner={
        isWaitingMembers ? (
          <div className="flex items-center justify-center gap-2 bg-success-subtle px-6 py-3 text-sm font-medium text-success-text">
            <CheckCircle2 size={15} />
            {group.status === 'full' ? '招募完成，等待團主啟用群組' : '已通過申請，需等待其他人加入'}
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
      mobileFooter={
        <div className="px-6 py-3">
          {isWaitingMembers ? (
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setShowMembers(true)}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-raised"
              >
                <Users size={17} /> 成員名單
              </button>
              <button
                onClick={() => setLeaveConfirm(true)}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-danger transition-colors hover:bg-red-50"
              >
                <LogOut size={17} /> 退出群組
              </button>
            </div>
          ) : canApply ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  size="lg"
                  className="flex-1 bg-[#1a1f36] text-white hover:bg-[#252b47]"
                  onClick={() => setApplyModalOpen(true)}
                >
                  申請加入 <ChevronRight size={16} />
                </Button>
                <button
                  onClick={toggleFav}
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition-colors ${
                    isFav ? 'border-red-100 bg-red-50 text-red-500' : 'border-line text-ink-2 hover:border-red-200 hover:text-red-400'
                  }`}
                  aria-label={isFav ? '取消收藏' : '加入收藏'}
                >
                  <Heart size={18} className={isFav ? 'fill-red-500' : ''} />
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-ink-4">申請後需經團主審核，通過後即可加入群組</p>
            </>
          ) : (
            renderCTA()
          )}
        </div>
      }
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
      {group && (
        <ApplyJoinModal
          group={group}
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          onSuccess={() => {
            setApplyModalOpen(false)
            handleClose()
            toast('申請已送出，等待團主審核', 'success', {
              persistent: true,
              action: { label: '前往查看', onClick: () => navigate('/my-subscriptions', { state: { tab: 'processing' } }) },
            })
          }}
          onDone={handleClose}
        />
      )}
    </GroupModalShell>

    {/* 成員名單 */}
    {group && (
      <Modal
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        title={`成員名單（${getMembersByGroupId(groupId).filter(m => m.userId !== group.hostId).length + 1} 人）`}
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{group.hostName}</p>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                      <Shield size={11} /> 團主
                    </span>
                  </div>
                  <p className="text-xs text-ink-3">{group.createdAt} 建立</p>
                </div>
                <button
                  onClick={() => { setShowMembers(false); openDm() }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-raised hover:text-brand"
                >
                  <MessageCircle size={20} />
                </button>
              </div>
            </div>
            {getMembersByGroupId(groupId).filter(m => m.userId !== activeUserId).map(m => (
              <div key={m.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-3">
                  <Avatar initial={m.userAvatarInitial} color={m.userAvatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{m.userName}</p>
                    <p className="text-xs text-ink-3">{m.joinedAt} 加入</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    )}

    {/* 退出確認 */}
    {leaveConfirm && (
      <ConfirmDialog
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
