import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Users, ShieldCheck, Heart, TrendingDown, Flame } from 'lucide-react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ServiceLogo from '../ui/ServiceLogo'
import { isGroupFavorited, toggleFavorite } from '../../stores/favoriteStore'
import { getActiveUser } from '../../stores/userStore'
import { getMinPlanPrice } from '../../services/serviceTypes'

export default function GroupCard({ group, onFavChange }) {
  const navigate = useNavigate()
  const activeUser = getActiveUser()
  const [isFav, setIsFav] = useState(() => activeUser ? isGroupFavorited(activeUser.id, group.id) : false)

  const minPlanPrice = getMinPlanPrice(group.serviceId)
  const savings = minPlanPrice != null && minPlanPrice > group.pricePerSeat
    ? minPlanPrice - group.pricePerSeat
    : null
  const isLastSeat = group.openSeats === 1

  function handleFav(e) {
    e.stopPropagation()
    if (!activeUser) return
    const next = toggleFavorite(activeUser.id, group.id)
    setIsFav(next)
    onFavChange?.(next, group.id)
  }

  return (
    <div
      className="card card-hover flex min-h-[14.25rem] cursor-pointer flex-col overflow-hidden p-5"
      onClick={() => navigate(`/groups/${group.id}`)}
    >
      {/* Header */}
      <div className="flex min-w-0 items-start gap-4">
        <ServiceLogo serviceId={group.serviceId} size={58} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-base font-extrabold leading-tight text-ink">{group.serviceName}</p>
            {group.isHostVerified && <ShieldCheck size={15} className="shrink-0 fill-success-subtle text-success" />}
          </div>
          <p className="mt-1 truncate text-sm font-medium text-ink-2">{group.planName}</p>
          {/* Urgency badge */}
          {isLastSeat && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-600">
              <Flame size={10} />
              最後 1 席
            </span>
          )}
        </div>
      </div>

      {/* Price + savings */}
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold tracking-normal text-brand">NT${group.pricePerSeat}</span>
            <span className="text-sm font-semibold text-ink-2">/ 每席</span>
          </div>
          {savings != null && (
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-success">
              <TrendingDown size={11} />
              比個人方案省 NT${savings}/月
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold leading-none text-ink">
            {group.usedSeats}
            <span className="mx-1 text-sm text-ink-3">/</span>
            <span className="text-sm text-ink-2">{group.totalSeats}</span>
          </p>
          <p className="mt-1 text-xs text-ink-3">剩餘名額</p>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-4 flex items-center gap-4 border-t border-line-subtle pt-3 text-sm">
        <span className="flex items-center gap-1.5 text-ink-2">
          <Star size={15} className="fill-warning text-warning" />
          <span className="font-bold">{group.hostRating}</span>
          <span className="text-ink-3">({group.hostReviewCount})</span>
        </span>
        <span className="h-4 w-px bg-line" />
        <span className="flex items-center gap-1.5">
          <Users size={15} className="text-brand" />
          <Badge variant={group.joinMode} />
        </span>
      </div>

      {/* CTA */}
      <div className="mt-auto flex items-center gap-3 pt-4">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={e => { e.stopPropagation(); navigate(`/groups/${group.id}`) }}
        >
          查看詳情
        </Button>
        <button
          onClick={handleFav}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-colors ${
            isFav
              ? 'border-red-200 bg-red-50 text-red-500'
              : 'border-line bg-white text-ink-3 hover:border-red-200 hover:bg-red-50 hover:text-red-400'
          }`}
          aria-label={isFav ? '取消收藏' : '加入收藏'}
        >
          <Heart size={16} className={isFav ? 'fill-red-500' : ''} />
        </button>
      </div>
    </div>
  )
}
