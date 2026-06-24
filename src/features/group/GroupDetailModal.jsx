import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, ChevronRight,
  CreditCard, Heart, LogIn, MessageCircle, ShieldCheck, Star,
} from 'lucide-react'
import { getGroupById, getGroups } from '../../shared/stores/groupStore'
import { getServiceById } from '../../shared/utils/serviceUtils'
import { getApplicationByUserAndGroup, getMemberGroupIds } from '../../shared/stores/applicationStore'
import { isCurrentUserMember, getMemberByUserAndGroup } from '../../shared/stores/memberStore'
import { isGroupFavorited, toggleFavorite } from '../../shared/stores/favoriteStore'
import { getCurrentUser } from '../../shared/stores/authStore'
import Avatar from '../../shared/ui/Avatar'
import Button from '../../shared/ui/Button'
import GroupModalShell from '../../shared/ui/GroupModalShell'
import ApplyJoinModal from './components/ApplyJoinModal'
import ExploreGroupCard from '../explore/components/ExploreGroupCard'

function computeIsApplied(app, groupId) {
  if (!app) return false
  return app.status !== 'rejected'
    && app.status !== 'removed'
    && !(app.status === 'approved' && !isCurrentUserMember(groupId))
}

// ── 團主評價 ──────────────────────────────────────────────────────────────────

function HostReviews({ group, hostStars, headerClassName }) {
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
  const [applied, setApplied]               = useState(false)
  const [isFav, setIsFav]                   = useState(false)

  const [tick, setTick] = useState(0)

  const isOpen       = !!groupId
  const activeUser   = getCurrentUser()
  const activeUserId = activeUser?.id

  useEffect(() => {
    function onGroupsChanged() { setTick(t => t + 1) }
    window.addEventListener('pm:groups-changed', onGroupsChanged)
    return () => window.removeEventListener('pm:groups-changed', onGroupsChanged)
  }, [])

  useEffect(() => {
    function refreshApplied() {
      if (!groupId || !activeUserId) return
      setApplied(computeIsApplied(getApplicationByUserAndGroup(activeUserId, groupId), groupId))
      setTick(t => t + 1)
    }
    window.addEventListener('pm:applications-changed', refreshApplied)
    window.addEventListener('pm:members-changed', refreshApplied)
    return () => {
      window.removeEventListener('pm:applications-changed', refreshApplied)
      window.removeEventListener('pm:members-changed', refreshApplied)
    }
  }, [groupId, activeUserId])

  useEffect(() => {
    function onOpen(e) {
      const gId = e.detail?.groupId ?? null
      setGroupId(gId)
      setApplyModalOpen(false)
      if (gId && activeUserId) {
        setApplied(computeIsApplied(getApplicationByUserAndGroup(activeUserId, gId), gId))
        setIsFav(isGroupFavorited(activeUserId, gId))
      } else {
        setApplied(false)
        setIsFav(false)
      }
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

  const memberGroupIds = useMemo(() => getMemberGroupIds(activeUserId), [activeUserId])

  if (!isOpen || !group) return null

  const isHost           = group.hostId === activeUserId
  const isMember         = isCurrentUserMember(group.id)
  const memberRecord     = activeUserId ? getMemberByUserAndGroup(activeUserId, group.id) : null
  const isPaymentPhase   = ['pending_confirmation', 'pending_activation', 'active'].includes(group.status)
  const hasServiceInfo   = !!memberRecord?.serviceInfo?.email
  const needsFillInfo    = isMember && isPaymentPhase && !hasServiceInfo
  const isPendingPayment = isMember && ['pending', 'payment_failed'].includes(memberRecord?.paymentStatus) && isPaymentPhase && hasServiceInfo
  const isMarkedPaid     = isMember && memberRecord?.paymentStatus === 'markedPaid' && isPaymentPhase
  const isWaitingMembers = isMember && ['recruiting', 'full'].includes(group.status)
  const isFull           = (group.openSeats ?? 0) <= 0
  const canApply         = !isHost && !isMember && !applied && !isFull && !!activeUserId

  function handleClose() { setGroupId(null) }
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
    if (isWaitingMembers) return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-success-subtle px-4 py-3 text-sm font-medium text-success-text">
        <CheckCircle2 size={15} />
        {group.status === 'full' ? '招募完成，等待團主啟用群組' : '已通過申請，需等待其他人加入'}
      </div>
    )
    if (needsFillInfo) return (
      <div className="flex justify-center">
        <div className="relative">
          <span className="absolute inset-1 rounded-xl bg-brand animate-ping opacity-20" />
          <button
            onClick={() => { handleClose(); navigate('/my-subscriptions', { state: { openGroupId: group.id } }) }}
            className="relative flex items-center gap-2 rounded-xl bg-brand px-6 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-hover"
          >
            <CreditCard size={15} /> 填寫服務帳號
          </button>
        </div>
      </div>
    )
    if (isPendingPayment) return (
      <button
        onClick={() => { handleClose(); navigate('/my-subscriptions', { state: { openGroupId: group.id, openPayment: true } }) }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
      >
        <CreditCard size={15} /> {memberRecord?.paymentStatus === 'payment_failed' ? '重新上傳付款憑證' : '前往付款'}
      </button>
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
    if (applied) return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-warning-subtle px-4 py-3 text-sm font-medium text-warning-text">
        <CheckCircle2 size={15} />已送出申請，等待團主審核
      </div>
    )
    return (
      <Button
        size="lg"
        className="w-full bg-[#1a1f36] text-white hover:bg-[#252b47]"
        onClick={() => setApplyModalOpen(true)}
      >
        申請加入 <ChevronRight size={16} />
      </Button>
    )
  }

  const hostStars  = group.hostRating != null ? Math.round(group.hostRating / 20) : 0
  const reviews    =<HostReviews group={group} hostStars={hostStars} headerClassName="text-lg font-black text-brand" />

  return (
    <GroupModalShell
      onClose={handleClose}
      group={group}
      service={service}
      plan={plan}
      hideRecruitBar={isMember || isHost || group.status !== 'recruiting'}
      summaryFavoriteSlot={
        <button
          onClick={toggleFav}
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-raised"
          aria-label={isFav ? '取消收藏' : '加入收藏'}
        >
          <Heart size={19} className={isFav ? 'fill-red-500 text-red-500' : 'text-ink-4'} />
        </button>
      }
      summaryFooter={
        <div className="px-6 py-4 lg:px-8">
          {activeUserId && !isHost && (
            <button
              onClick={openDm}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-brand hover:text-brand"
            >
              <MessageCircle size={15} /> 聯絡團主
            </button>
          )}
          {renderCTA()}
          {canApply && (
            <p className="mt-2 text-center text-xs text-ink-4">申請後需經團主審核，通過後即可加入群組</p>
          )}
          {group.openSeats <= 2 && !isFull && canApply && (
            <p className="mt-1 text-center text-xs text-warning-text">僅剩 {group.openSeats} 個名額</p>
          )}
        </div>
      }
      desktopReviewsSection={reviews}
      mobileReviewsSection={reviews}
      mobileFooter={
        <div className="px-6 py-3">
          {renderCTA()}
          <div className="mt-2 flex gap-2">
            <button
              onClick={toggleFav}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                isFav ? 'border-red-100 bg-red-50 text-red-500' : 'border-line text-ink-2 hover:border-red-200 hover:text-red-400'
              }`}
              aria-label={isFav ? '取消收藏' : '加入收藏'}
            >
              <Heart size={15} className={isFav ? 'fill-red-500' : ''} />
              {isFav ? '已收藏' : '收藏'}
            </button>
            {activeUserId && !isHost && (
              <button
                onClick={openDm}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-brand hover:text-brand"
              >
                <MessageCircle size={15} /> 聯絡團主
              </button>
            )}
          </div>
        </div>
      }
      afterColumns={picks.length > 0 && (
        <div className="border-t border-line px-6 pb-4 pt-5">
          <h3 className="mb-4 text-lg font-black text-brand">其他推薦群組</h3>
          <div className="flex gap-3 overflow-x-auto px-0.5 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {picks.map(g => (
              <div key={g.id} className="w-64 shrink-0">
                <ExploreGroupCard group={g} isMember={memberGroupIds.has(g.id)} />
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
          onSuccess={() => { setApplied(true); setApplyModalOpen(false) }}
          onDone={handleClose}
        />
      )}
    </GroupModalShell>
  )
}
