import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Heart, Star } from 'lucide-react'
import Button from '../../../shared/components/ui/Button'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import { isGroupFavorited, toggleFavorite } from '../../../shared/stores/favoriteStore'
import { getActiveUser } from '../../../shared/stores/userStore'

const AVATAR_COLORS = ['#3B82F6', '#EC4899', '#F59E0B']

export default function RecommendationCard({ group }) {
  const navigate = useNavigate()
  const activeUser = getActiveUser()
  const [isFav, setIsFav] = useState(() => activeUser ? isGroupFavorited(activeUser.id, group.id) : false)

  function handleFav(e) {
    e.stopPropagation()
    if (!activeUser) return
    setIsFav(toggleFavorite(activeUser.id, group.id))
  }

  return (
    <article className="card card-hover rounded-[var(--radius-card)] p-5">
      <div className="flex items-start gap-4">
        <ServiceLogo serviceId={group.serviceId} size={58} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-extrabold text-ink">{group.serviceName}</h3>
            {group.isHostVerified && <CheckCircle2 size={14} className="shrink-0 fill-emerald-50 text-emerald-500" />}
          </div>
          <p className="mt-1 truncate text-sm font-medium text-ink-3">{group.planName}</p>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-extrabold leading-none text-brand">NT${group.pricePerSeat}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">/ 每席</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold leading-none text-ink">
            {group.usedSeats}
            <span className="mx-1 text-sm text-ink-3">/</span>
            <span className="text-sm text-ink-2">{group.totalSeats}</span>
          </p>
          <p className="mt-1 text-xs font-medium text-ink-3">剩餘名額</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line-subtle pt-3">
        <div className="flex items-center gap-1.5 text-sm">
          <Star size={15} className="fill-amber-400 text-amber-400" />
          <span className="font-extrabold text-ink">{group.hostRating}</span>
          <span className="text-ink-3">({group.hostReviewCount})</span>
        </div>
        <div className="flex items-center">
          {AVATAR_COLORS.map((color, index) => (
            <span
              key={color}
              className="-ml-2 grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[11px] font-bold text-white first:ml-0"
              style={{ backgroundColor: color }}
            >
              {index + 1}
            </span>
          ))}
          <span className="ml-2 text-xs font-medium text-ink-3">已加入 {group.hostReviewCount} 人</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          className="h-10 flex-1"
          onClick={() => navigate(`/groups/${group.id}`)}
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
    </article>
  )
}
