import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Star, Users, Calendar, ChevronRight, LogIn, ShieldCheck, Heart, CreditCard } from 'lucide-react'
import Badge from '../../../shared/components/ui/Badge'
import Button from '../../../shared/components/ui/Button'
import Avatar from '../../../shared/components/ui/Avatar'
import ProgressBar from '../../../shared/components/ui/ProgressBar'
import ApplyJoinModal from '../../../shared/components/modals/ApplyJoinModal'
import InstantJoinModal from '../../../shared/components/modals/InstantJoinModal'
import { getApplicationByUserAndGroup } from '../../../shared/stores/applicationStore'
import { isCurrentUserMember, getMemberByUserAndGroup } from '../../../shared/stores/memberStore'
import { isGroupFavorited, toggleFavorite } from '../../../shared/stores/favoriteStore'
import { getActiveUser } from '../../../shared/stores/userStore'

export default function StickyJoinSummary({ group }) {
  const navigate = useNavigate()
  const activeUser = getActiveUser()
  const activeUserId = activeUser?.id
  const isHost = group.hostId === activeUserId

  const [isMember, setIsMember] = useState(
    () => isCurrentUserMember(group.id)
  )
  const memberRecord = activeUserId ? getMemberByUserAndGroup(activeUserId, group.id) : null
  const isPendingPayment = isMember && memberRecord?.paymentStatus === 'pending'
  const isMarkedPaid    = isMember && memberRecord?.paymentStatus === 'markedPaid'
  const [applied, setApplied] = useState(
    () => activeUserId ? !!getApplicationByUserAndGroup(activeUserId, group.id) : false
  )
  const [openSeats, setOpenSeats] = useState(group.openSeats)
  const [usedSeats, setUsedSeats] = useState(group.usedSeats)
  const [modalOpen, setModalOpen] = useState(false)
  const [isFav, setIsFav] = useState(() => activeUserId ? isGroupFavorited(activeUserId, group.id) : false)

  const isFull = openSeats <= 0
  const isInstant = group.joinMode === 'instant'

  function handleInstantSuccess() {
    setIsMember(true)
    setOpenSeats(s => s - 1)
    setUsedSeats(s => s + 1)
  }

  function renderCTA() {
    if (!activeUserId) {
      return (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => navigate(`/login?redirectTo=${encodeURIComponent(`/groups/${group.id}`)}`)}
        >
          <LogIn size={16} />
          登入以加入群組
        </Button>
      )
    }
    if (isHost) {
      return (
        <div className="flex items-center gap-2 bg-brand-subtle text-brand text-sm font-medium px-4 py-3 rounded-lg">
          <ShieldCheck size={16} />
          你是此群組的團主
        </div>
      )
    }
    if (isPendingPayment) {
      return (
        <div className="flex items-center gap-2 bg-warning-subtle text-warning-text text-sm font-medium px-4 py-3 rounded-lg">
          <CreditCard size={16} />
          已加入，請前往「我的訂閱」完成付款
        </div>
      )
    }
    if (isMarkedPaid) {
      return (
        <div className="flex items-center gap-2 bg-purple-subtle text-purple-text text-sm font-medium px-4 py-3 rounded-lg">
          <CheckCircle2 size={16} />
          已標記付款，等待團主確認
        </div>
      )
    }
    if (isMember) {
      return (
        <div className="flex items-center gap-2 bg-success-subtle text-success-text text-sm font-medium px-4 py-3 rounded-lg">
          <CheckCircle2 size={16} />
          已加入此群組
        </div>
      )
    }
    if (isFull) {
      return (
        <Button variant="ghost" size="lg" className="w-full border border-line" disabled>
          已額滿
        </Button>
      )
    }
    if (!isInstant && applied) {
      return (
        <div className="flex items-center gap-2 bg-warning-subtle text-warning-text text-sm font-medium px-4 py-3 rounded-lg">
          <CheckCircle2 size={16} />
          已送出申請，等待團主審核
        </div>
      )
    }
    return (
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => setModalOpen(true)}
      >
        {isInstant ? '立即加入' : '申請加入'}
        <ChevronRight size={16} />
      </Button>
    )
  }

  return (
    <>
      <div className="sticky top-[7rem] panel overflow-hidden">
        {/* Price header */}
        <div className="px-5 py-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ink-2 mb-0.5">每席價格</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-brand">NT${group.pricePerSeat}</span>
              <span className="text-ink-2 text-sm font-bold">/ 每月</span>
            </div>
          </div>
          <button
            onClick={() => activeUserId ? setIsFav(toggleFavorite(activeUserId, group.id)) : navigate('/login')}
            className="mt-1 w-9 h-9 flex items-center justify-center rounded-full hover:bg-raised transition-colors shrink-0"
            aria-label={isFav ? '取消收藏' : '加入收藏'}
          >
            <Heart
              size={20}
              className={isFav ? 'fill-red-500 text-red-500' : 'text-ink-4'}
            />
          </button>
        </div>

        <div className="border-t border-line-subtle p-5 flex flex-col gap-4">
          {/* Seats */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-sm text-ink-2">
                <Users size={14} />
                <span>剩餘名額</span>
              </div>
              <span className="text-sm font-semibold text-ink">
                <span className="text-ink">{openSeats}</span> 席 / 總名額 {group.totalSeats} 席
              </span>
            </div>
            <ProgressBar value={usedSeats} max={group.totalSeats} />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-ink-4">已佔 {usedSeats} 人</span>
              <span className="text-xs text-ink-4">共 {group.totalSeats} 人</span>
            </div>
          </div>

          {/* Billing date */}
          <div className="flex items-center justify-between py-2 border-t border-line-subtle">
            <div className="flex items-center gap-1.5 text-sm text-ink-3">
              <Calendar size={14} />
              <span>下次扣款日</span>
            </div>
            <span className="text-sm font-bold text-ink-2">{group.nextBillingDate}</span>
          </div>

          {/* Join mode */}
          <div className="flex items-center justify-between py-2 border-t border-line-subtle">
            <span className="text-sm text-ink-3">加入方式</span>
            <Badge variant={group.joinMode} />
          </div>

          {/* CTA */}
          {renderCTA()}

          {openSeats <= 2 && !isFull && !isMember && !applied && !isHost && (
            <p className="text-xs text-warning-text text-center -mt-2">
              僅剩 {openSeats} 個名額，手快有！
            </p>
          )}

          {/* Host info */}
          <div className="border-t border-line-subtle pt-4">
            <p className="text-xs text-ink-4 mb-3">關於團主</p>
            <div className="flex items-center gap-3">
              <Avatar initial={group.hostAvatarInitial} color={group.hostAvatarColor} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink">{group.hostName}</span>
                  {group.isHostVerified && (
                    <CheckCircle2 size={13} className="text-brand shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs text-ink-3">
                    {group.hostRating} · {group.hostReviewCount} 則評價
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isInstant ? (
        <InstantJoinModal
          group={{ ...group, openSeats, usedSeats }}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            handleInstantSuccess()
            setModalOpen(false)
          }}
        />
      ) : (
        <ApplyJoinModal
          group={group}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setApplied(true)
            setModalOpen(false)
          }}
        />
      )}
    </>
  )
}
