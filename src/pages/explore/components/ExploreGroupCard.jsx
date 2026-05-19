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
import ServiceLogo from '../../../shared/components/ui/ServiceLogo'
import { isGroupFavorited, toggleFavorite } from '../../../shared/stores/favoriteStore'
import { getGroupsByHostId } from '../../../shared/stores/groupStore'
import { getActiveUser } from '../../../shared/stores/userStore'

const JOIN_MODE_LABEL = { instant: '立即加入', approval: '需審核' }
const AVATAR_COLORS = ['#0F172A', '#F97316', '#14B8A6', '#8B5CF6']

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
  const hostedCount = useMemo(
    () => getGroupsByHostId(group.hostId).filter(item => item.status !== 'cancelled').length,
    [group.hostId],
  )

  function openDetails(e) {
    e?.stopPropagation()
    navigate(`/groups/${group.id}`)
  }

  function handleFav(e) {
    e.stopPropagation()
    if (!activeUser) { navigate('/login'); return }
    setIsFav(toggleFavorite(activeUser.id, group.id))
  }

  return (
    <article
      className="card card-hover group relative flex min-h-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border-line bg-white p-4 shadow-[0_18px_45px_-32px_rgb(20_44_91_/_0.48)] sm:p-5"
      onClick={openDetails}
    >
      <div>
        <Badge
          variant="recruiting"
          className="bg-success-subtle px-3.5 py-1 text-sm font-extrabold text-success-text"
        />
      </div>

      <div className="mt-5 grid grid-cols-[5.75rem_minmax(0,1fr)] gap-4">
        <ServiceLogo
          serviceId={group.serviceId}
          size={92}
          className="rounded-[1.45rem] border-line-strong"
        />

        <div className="min-w-0">
          <h2 className="truncate text-2xl font-black leading-tight text-ink">{group.serviceName}</h2>
          <p className="mt-1 truncate text-lg font-semibold text-ink-3">{group.planName}</p>

          {featureChips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {featureChips.map(({ label, Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-2.5 py-1 text-xs font-extrabold text-brand"
                >
                  <Icon size={14} strokeWidth={2.25} />
                  {label}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-2.5">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-white text-sm font-black text-white shadow-sm"
              style={{ backgroundColor: group.hostAvatarColor ?? '#94A3B8' }}
            >
              {group.hostAvatarInitial}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-base font-black text-ink">團主 {group.hostName}</span>
                {group.isHostVerified && <BadgeCheck size={17} className="shrink-0 fill-brand text-white" />}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-medium text-ink-3">
                <span className="inline-flex items-center gap-1">
                  <Star size={14} className="fill-warning text-warning" />
                  {group.hostRating} ({group.hostReviewCount} 評價)
                </span>
                <span className="text-ink-4">・</span>
                <span>已開團 {hostedCount} 次</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="my-5 border-t border-line-subtle" />

      <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(7rem,0.95fr)] gap-2.5">
        <div className="rounded-2xl border border-success/10 bg-success-subtle/40 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-black text-ink">剩餘名額</p>
            <div className="text-right">
              <p className="text-xl font-black leading-none text-success">
                {group.usedSeats} <span className="text-ink">/ {group.totalSeats} 人</span>
              </p>
              {isLastSeat && <p className="mt-1 text-sm font-extrabold text-success">即將額滿</p>}
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-success transition-all"
              style={{ width: `${usedRatio * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-success/10 bg-success-subtle/40 p-3.5 text-center">
          <div className="flex justify-center -space-x-2">
            {Array.from({ length: Math.min(group.usedSeats, 2) }).map((_, index) => (
              <div
                key={index}
                className="grid h-8 w-8 place-items-center rounded-full border-2 border-white text-[11px] font-black text-white shadow-sm"
                style={{ backgroundColor: index === 0 ? group.hostAvatarColor ?? AVATAR_COLORS[0] : AVATAR_COLORS[index % AVATAR_COLORS.length] }}
              >
                {index === 0 ? group.hostAvatarInitial : index + 1}
              </div>
            ))}
            {group.usedSeats > 2 && (
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-success text-xs font-black text-white shadow-sm">
                +{group.usedSeats - 2}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-semibold text-ink-3">共 {group.usedSeats} 位成員</p>
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 pt-5">
        <p className="whitespace-nowrap text-3xl font-black leading-none text-ink">
          NT${group.pricePerSeat}
          <span className="ml-1 text-base font-semibold text-ink-3">/ 人・月</span>
        </p>

        <button
          onClick={handleFav}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-white shadow-floating transition-colors ${
            isFav
              ? 'border-red-100 text-red-500'
              : 'border-line-subtle text-ink hover:border-red-100 hover:text-red-400'
          }`}
          aria-label={isFav ? '取消收藏' : '加入收藏'}
        >
          <Heart size={20} strokeWidth={2.4} className={isFav ? 'fill-red-500' : ''} />
        </button>
      </div>
    </article>
  )
}
