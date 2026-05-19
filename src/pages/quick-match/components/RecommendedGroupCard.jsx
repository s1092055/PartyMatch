import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Users, CheckCircle2, Lightbulb, Heart } from 'lucide-react'
import Badge from '../../../shared/components/ui/Badge'
import Button from '../../../shared/components/ui/Button'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import { isGroupFavorited, toggleFavorite } from '../../../shared/stores/favoriteStore'
import { getActiveUser } from '../../../shared/stores/userStore'

export default function RecommendedGroupCard({ group, rank }) {
  const navigate = useNavigate()
  const activeUser = getActiveUser()
  const [isFav, setIsFav] = useState(() => activeUser ? isGroupFavorited(activeUser.id, group.id) : false)

  return (
    <div className="card card-hover p-5 flex flex-col lg:flex-row gap-6">
      {/* Rank badge */}
      <div className="shrink-0 flex md:flex-col items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          rank === 1 ? 'bg-amber-100 text-amber-600' :
          rank === 2 ? 'bg-raised text-ink-3' :
                       'bg-orange-50 text-orange-500'
        }`}>
          {rank}
        </div>
        <ServiceLogo serviceId={group.serviceId} size={66} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold text-ink">{group.serviceName}</span>
              {group.isHostVerified && <CheckCircle2 size={14} className="text-brand" />}
            </div>
            <p className="text-xs text-ink-3">{group.planName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={group.status} />
            <button
              onClick={() => activeUser && setIsFav(toggleFavorite(activeUser.id, group.id))}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-raised transition-colors"
              aria-label={isFav ? '取消收藏' : '加入收藏'}
            >
              <Heart
                size={15}
                className={isFav ? 'fill-red-500 text-red-500' : 'text-ink-4'}
              />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3 mb-3">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-brand">NT${group.pricePerSeat}</span>
            <span className="text-xs text-ink-4">/ 月</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-ink-3">
            <Users size={12} />
            <span>剩餘 {group.openSeats} 人</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-ink-2">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="font-medium">{group.hostRating}</span>
            <span className="text-ink-4">({group.hostReviewCount})</span>
          </div>
          <Badge variant={group.joinMode} />
        </div>

        {/* Recommendation reasons */}
        {group._reasons?.length > 0 && (
          <div className="rounded-[var(--radius-inner)] border border-success/20 bg-success-subtle px-4 py-3">
            <div className="flex items-center gap-1.5 text-sm font-extrabold text-success-text mb-1.5">
              <Lightbulb size={12} />
              推薦原因
            </div>
            <ul className="space-y-1">
              {group._reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-success-text">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-success" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="flex lg:flex-col gap-3 lg:w-44 shrink-0 justify-center">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 lg:w-full"
          onClick={() => navigate(`/groups/${group.id}`)}
        >
          查看詳情
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-1 lg:w-full"
          onClick={() => navigate(`/groups/${group.id}`)}
        >
          {group.joinMode === 'instant' ? '立即加入' : '申請加入'}
        </Button>
      </div>
    </div>
  )
}
