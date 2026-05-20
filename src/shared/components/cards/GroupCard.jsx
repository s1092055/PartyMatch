import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Heart, ShieldCheck, Star } from 'lucide-react'
import Badge from '../ui/Badge'
import ServiceLogo from '../ui/ServiceLogo'
import { isGroupFavorited, toggleFavorite } from '../../stores/favoriteStore'
import { getActiveUser } from '../../stores/userStore'

const JOIN_MODE_LABEL = { instant: '立即加入', approval: '需審核' }

const AVATAR_COLORS = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function GroupCard({ group, onFavChange }) {
  const navigate = useNavigate()
  const activeUser = getActiveUser()
  const [isFav, setIsFav] = useState(() => activeUser ? isGroupFavorited(activeUser.id, group.id) : false)

  const isLastSeat = group.openSeats === 1
  const usedRatio = group.totalSeats > 0 ? group.usedSeats / group.totalSeats : 0
  const barColor = isLastSeat ? 'bg-warning' : 'bg-success'

  const joinLabel = JOIN_MODE_LABEL[group.joinMode]
  const displayTags = group.tags?.length > 0
    ? [...group.tags.slice(0, 2), ...(joinLabel ? [joinLabel] : [])].slice(0, 3)
    : joinLabel ? [joinLabel] : []

  function handleFav(e) {
    e.stopPropagation()
    if (!activeUser) { navigate('/login'); return }
    const next = toggleFavorite(activeUser.id, group.id)
    setIsFav(next)
    onFavChange?.(next, group.id)
  }

  return (
    <div
      className="card card-hover flex cursor-pointer flex-col overflow-hidden p-0"
      onClick={() => navigate(`/groups/${group.id}`)}
    >
      
      <div className="flex items-center justify-between px-4 pb-0 pt-3">
        <Badge variant="recruiting" />
        <button
          onClick={handleFav}
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors ${
            isFav
              ? 'border-red-200 bg-red-50 text-red-500'
              : 'border-line bg-white text-ink-3 hover:border-red-200 hover:bg-red-50 hover:text-red-400'
          }`}
          aria-label={isFav ? '取消收藏' : '加入收藏'}
        >
          <Heart size={15} className={isFav ? 'fill-red-500' : ''} />
        </button>
      </div>

<div className="flex items-start gap-4 px-4 pb-3 pt-3">
        <ServiceLogo serviceId={group.serviceId} size={80} className="shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-extrabold leading-tight text-ink">{group.serviceName}</p>
          <p className="mt-0.5 text-sm text-ink-3">{group.planName}</p>
          {displayTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {displayTags.map(tag => (
                <span key={tag} className="rounded-full bg-raised px-2 py-0.5 text-2xs font-medium text-ink-2">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

<div className="flex items-center gap-2 px-4 pb-3">
        <div
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: group.hostAvatarColor ?? '#94A3B8' }}
        >
          {group.hostAvatarInitial}
        </div>
        <span className="text-sm text-ink-2">團主 {group.hostName}</span>
        {group.isHostVerified && (
          <ShieldCheck size={14} className="shrink-0 fill-info-subtle text-info" />
        )}
        <div className="ml-auto flex items-center gap-1 text-xs text-ink-3">
          <Star size={12} className="fill-warning text-warning" />
        </div>
      </div>

<div className="mx-4 border-t border-line-subtle" />

<div className="flex gap-2 px-4 py-3">
        
        <div className="flex-1 rounded-xl bg-raised p-3">
          <p className="mb-2 text-xs text-ink-3">剩餘名額</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${usedRatio * 100}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">{group.usedSeats} / {group.totalSeats} 人</span>
            {isLastSeat && (
              <span className="text-[10px] font-bold text-warning-text">即將額滿</span>
            )}
          </div>
        </div>

<div className="flex-1 rounded-xl bg-raised p-3">
          <p className="mb-2 text-xs text-ink-3">成員</p>
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(group.usedSeats, 3) }).map((_, i) => (
                <div
                  key={i}
                  className="grid h-6 w-6 place-items-center rounded-full border-2 border-white text-[9px] font-bold text-white"
                  style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            {group.usedSeats > 3 && (
              <span className="rounded-full bg-success-subtle px-1.5 py-0.5 text-[10px] font-bold text-success-text">
                +{group.usedSeats - 3}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-ink-2">共 {group.usedSeats} 位成員</p>
        </div>
      </div>

<div className="flex items-center gap-3 border-t border-line-subtle px-4 py-3">
        <div className="flex-1 min-w-0">
          <span className="text-base font-extrabold text-ink">NT${group.pricePerSeat}</span>
          <span className="ml-1 text-xs text-ink-3">/ 人·月</span>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs text-ink-3">
          <Calendar size={11} className="shrink-0" />
          <span>啟用後計費</span>
        </div>
      </div>
    </div>
  )
}
