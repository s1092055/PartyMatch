import { memo, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart,
  Monitor,
  Users,
} from 'lucide-react'
import Badge from '../../../shared/ui/Badge'
import ServiceLogo from '../../../shared/ui/ServiceLogo'
import { isGroupFavorited, toggleFavorite } from '../../../shared/stores/favoriteStore'
import { getCurrentUser } from '../../../shared/stores/authStore'

// Tags that are too generic or junk to show as feature chips
const JUNK_TAGS = new Set(['立即加入', '審核加入', '需要審核', '需審核', '名額剩 1'])
// Tags to skip in the first pass (broad categories), but use as fallback
const CATEGORY_TAGS = new Set(['影音', '音樂', '雲端', 'AI 工具', 'AI工具', '辦公', '通訊'])

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

  // First pass: specific (non-category) tags
  tags
    .filter(tag => !JUNK_TAGS.has(tag) && !CATEGORY_TAGS.has(tag))
    .forEach(tag => {
      if (!labels.includes(tag) && labels.length < 2) labels.push(tag)
    })

  // Fallback: use category tags when nothing specific was found
  if (labels.length === 0) {
    tags
      .filter(tag => !JUNK_TAGS.has(tag))
      .slice(0, 2)
      .forEach(tag => { if (!labels.includes(tag)) labels.push(tag) })
  }

  return labels.slice(0, 3).map(label => ({
    label,
    Icon: label.includes('家庭') ? Users : Monitor,
  }))
}

function ExploreGroupCard({ group, onFavChange, onBeforeNavigate, hideActions = false, isApplied = false, isMember = false }) {
  const navigate = useNavigate()
  const activeUser = getCurrentUser()
  const [isFav, setIsFav] = useState(() => activeUser ? isGroupFavorited(activeUser.id, group.id) : false)

  useEffect(() => {
    function sync() { setIsFav(activeUser ? isGroupFavorited(activeUser.id, group.id) : false) }
    window.addEventListener('pm:favorites-changed', sync)
    return () => window.removeEventListener('pm:favorites-changed', sync)
  }, [activeUser, group.id])

  const usedRatio = group.totalSeats > 0 ? Math.min(group.usedSeats / group.totalSeats, 1) : 0
  const isLastSeat = group.openSeats === 1
  const featureChips = useMemo(() => buildFeatureChips(group), [group])

  function openDetails(e) {
    e.stopPropagation()
    onBeforeNavigate?.()
    window.dispatchEvent(new CustomEvent('pm:open-group', { detail: { groupId: group.id } }))
  }

  function handleFav(e) {
    e.stopPropagation()
    if (!activeUser) { onBeforeNavigate?.(); navigate('/login'); return }
    const next = toggleFavorite(activeUser.id, group.id)
    setIsFav(next)
    onFavChange?.(next, group.id)
  }

  return (
    <article
      className="card card-hover group relative flex min-h-full cursor-pointer flex-col overflow-hidden rounded-card border-line bg-surface px-6 py-5 shadow-[0_18px_45px_-32px_rgb(20_44_91_/_0.48)] transition-all duration-200"
      onClick={openDetails}
    >
      {!hideActions && (
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
      )}

      <div className="flex justify-center">
        {isMember ? (
          <span className="rounded-full bg-success-subtle px-3.5 py-1 text-sm font-extrabold text-success-text">
            申請通過
          </span>
        ) : isApplied ? (
          <span className="rounded-full bg-warning-subtle px-3.5 py-1 text-sm font-extrabold text-warning-text">
            已申請
          </span>
        ) : (
          <Badge
            variant="recruiting"
            className="bg-success-subtle px-3.5 py-1 text-sm font-extrabold text-success-text"
          />
        )}
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

      <div className="mt-3 flex h-7 justify-center gap-1.5 overflow-hidden">
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

      <p className="my-4 text-center text-2xl font-black leading-none text-ink">
        NT${group.billingCycle === 'yearly' ? group.pricePerSeat * 12 : group.pricePerSeat}
        <span className="ml-1 text-sm font-semibold text-ink-3">{group.billingCycle === 'yearly' ? '/ 年' : '/ 月'}</span>
      </p>

      <div className="mb-4 border-t border-line-subtle" />

      <div className="px-2">
        {group.totalSeats == null ? (
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-bold text-ink-3">剩餘名額</p>
            <p className="text-sm font-semibold text-ink-4">尚未設定</p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-bold text-ink-3">剩餘名額</p>
              <p className="text-sm font-black text-ink">
                <span className={isLastSeat ? 'text-warning-text' : 'text-success'}>{group.openSeats}</span>
                <span className="text-ink-4"> / {group.totalSeats}</span>
              </p>
            </div>
            <div
              role="progressbar"
              aria-valuenow={group.usedSeats}
              aria-valuemin={0}
              aria-valuemax={group.totalSeats}
              aria-label="名額使用率"
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-line"
            >
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${usedRatio * 100}%` }}
              />
            </div>
          </>
        )}
      </div>

      <button
        onClick={openDetails}
        className="mt-4 w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
      >
        查看詳情
      </button>

    </article>
  )
}

export default memo(ExploreGroupCard, (prev, next) =>
  prev.group.id === next.group.id &&
  prev.group.status === next.group.status &&
  prev.group.openSeats === next.group.openSeats &&
  prev.isApplied === next.isApplied &&
  prev.isMember === next.isMember &&
  prev.hideActions === next.hideActions &&
  prev.onFavChange === next.onFavChange &&
  prev.onBeforeNavigate === next.onBeforeNavigate
)
