import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  Heart,
  Monitor,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react'
import Badge from '../../../shared/components/ui/Badge'
import Button from '../../../shared/components/ui/Button'
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import { isGroupFavorited, toggleFavorite } from '../../../shared/stores/favoriteStore'
import { getActiveUser } from '../../../shared/stores/userStore'

const JOIN_MODE_LABEL = { instant: '立即加入', approval: '需審核' }
function buildFeatureChips(group) {
  const tags = group.tags ?? []
  const source = `${group.planName} ${tags.join(' ')}`
  const labels = []

  if (/4K|HDR/i.test(source) || (group.serviceId === 'disney' && group.planName.includes('高級'))) {
    labels.push('4K 畫質')
  }

  if (/家庭|Family|共享/.test(source)) {
    labels.push('家庭方案')
  }

  if (/2\s*TB/i.test(source)) {
    labels.push('2TB 空間')
  } else if (/200\s*GB/i.test(source)) {
    labels.push('200GB 空間')
  }

  tags
    .filter(tag => !['影音', '音樂', '雲端', 'AI 工具', 'AI工具', '辦公', '通訊', '立即加入', '審核加入', '需要審核', '需審核', '名額剩 1'].includes(tag))
    .forEach(tag => {
      if (!labels.includes(tag) && labels.length < 2) labels.push(tag)
    })

  const joinLabel = JOIN_MODE_LABEL[group.joinMode]
  if (joinLabel) labels.push(joinLabel)

  return labels.slice(0, 3).map(label => ({
    label,
    Icon: label === joinLabel ? ShieldCheck : label.includes('家庭') ? Users : Monitor,
  }))
}

export default function ExploreGroupCard({ group }) {
  const navigate = useNavigate()
  const activeUser = getActiveUser()
  const [isFav, setIsFav] = useState(() => activeUser ? isGroupFavorited(activeUser.id, group.id) : false)

  const usedRatio = group.totalSeats > 0 ? Math.min(group.usedSeats / group.totalSeats, 1) : 0
  const isLastSeat = group.openSeats === 1
  const featureChips = useMemo(() => buildFeatureChips(group), [group])

  function openDetails(e) {
    e.stopPropagation()
    navigate(`/groups/${group.id}`)
  }

  function handleFav(e) {
    e.stopPropagation()
    if (!activeUser) { navigate('/login'); return }
    setIsFav(toggleFavorite(activeUser.id, group.id))
  }

  return (
    <article
      className="card card-hover group relative flex min-h-full cursor-pointer flex-col overflow-hidden rounded-card border-line bg-surface p-5 shadow-[0_18px_45px_-32px_rgb(20_44_91_/_0.48)]"
      onClick={openDetails}
    >
      <button
        onClick={handleFav}
        className={`absolute right-4 top-4 grid h-9 w-9 shrink-0 place-items-center rounded-full border bg-surface shadow-floating transition-colors ${
          isFav
            ? 'border-red-100 text-red-500'
            : 'border-line-subtle text-ink hover:border-red-100 hover:text-red-400'
        }`}
        aria-label={isFav ? '取消收藏' : '加入收藏'}
      >
        <Heart size={18} strokeWidth={2.4} className={isFav ? 'fill-red-500' : ''} />
      </button>

      <div className="flex justify-center">
        <Badge
          variant="recruiting"
          className="bg-success-subtle px-3.5 py-1 text-sm font-extrabold text-success-text"
        />
      </div>

      <div className="mt-4 flex justify-center">
        <ServiceLogo
          serviceId={group.serviceId}
          size={80}
          className="rounded-logo border-line-strong"
        />
      </div>

      <div className="mt-3 text-center">
        <h2 className="text-xl font-black leading-tight text-ink">{group.serviceName}</h2>
        <p className="mt-1 text-base font-semibold text-ink-3">{group.planName}</p>
      </div>

      {featureChips.length > 0 && (
        <div className="mt-3 flex justify-center gap-1.5 overflow-hidden">
          {featureChips.map(({ label, Icon }) => (
            <span
              key={label}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-line px-2.5 py-1 text-xs font-extrabold text-ink-3"
            >
              <Icon size={14} strokeWidth={2.25} />
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="my-4 border-t border-line-subtle" />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-white text-sm font-black text-white shadow-sm"
            style={{ backgroundColor: group.hostAvatarColor ?? '#94A3B8' }}
          >
            {group.hostAvatarInitial}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1">
              <span className="truncate text-sm font-black text-ink">{group.hostName}</span>
              {group.isHostVerified && <BadgeCheck size={14} className="shrink-0 fill-brand text-white" />}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-xs font-medium text-ink-3">
              <Star size={12} className="fill-warning text-warning" />
              <span>{group.hostRating}</span>
              <span className="text-ink-4">·</span>
              <span>{group.hostReviewCount} 評價</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-bold text-ink-3">剩餘名額</p>
            <p className="text-sm font-black text-ink">
              <span className={isLastSeat ? 'text-warning-text' : 'text-success'}>{group.openSeats}</span>
              <span className="text-ink-4"> / {group.totalSeats}</span>
            </p>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-success transition-all"
              style={{ width: `${usedRatio * 100}%` }}
            />
          </div>
          <p className="mt-1 text-right text-2xs text-ink-4">
            {isLastSeat ? '即將額滿！' : `已加入 ${group.usedSeats} 人`}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <p className="mb-3 text-center text-2xl font-black leading-none text-ink">
          NT${group.pricePerSeat}
          <span className="ml-1 text-sm font-semibold text-ink-3">/ 人・月</span>
        </p>
        <Button onClick={openDetails} className="w-full">查看詳情</Button>
      </div>
    </article>
  )
}
