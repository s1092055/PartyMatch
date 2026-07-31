import { memo, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Monitor,
  Users,
} from 'lucide-react'
import ServiceLogo from '../../../components/ui/ServiceLogo'
import FavoriteToggleButton from '../../../components/ui/FavoriteToggleButton'
import TokenAmount from '../../../components/ui/TokenAmount'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { getStatusLabel } from '../../../components/ui/statusBadgeConfig'
import { Progress } from '../../../components/ui/progress'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { calcDisplayPrice, calcDisplayCycle } from '../../../common/utils/pricingUtils'
import { useFavoriteStore } from '../../../common/stores/useFavoriteStore'
import { useAuthStore } from '../../../common/stores/useAuthStore'

// Tags that are too generic or junk to show as feature chips
const JUNK_TAGS = new Set(['審核加入', '需要審核', '需審核', '名額剩 1'])
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

const RANK_BADGE_STYLES = [
  'bg-amber-400 text-white',
  'bg-slate-300 text-slate-700',
  'bg-orange-300 text-white',
]

function ExploreGroupCard({ group, onFavChange, onBeforeNavigate, hideActions = false, isApplied = false, isMember = false, rank }) {
  const navigate = useNavigate()
  const activeUser = useAuthStore(s => s.user)
  const isFav = useFavoriteStore(s => activeUser ? s.isFavorited(activeUser.id, group.id) : false)

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
    const next = useFavoriteStore.getState().toggle(activeUser.id, group.id)
    onFavChange?.(next, group.id)
  }

  return (
    <Card
      as="article"
      className="card-lift relative flex min-h-full cursor-pointer flex-col overflow-hidden px-6 py-5"
      onClick={openDetails}
    >
      {rank != null && (
        <span className={`absolute left-4 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold shadow-sm ${RANK_BADGE_STYLES[rank - 1] ?? RANK_BADGE_STYLES[2]}`}>
          {rank}
        </span>
      )}

      {!hideActions && (
        <FavoriteToggleButton
          isFav={isFav}
          onClick={handleFav}
          heartSize={18}
          className="absolute right-4 top-4 h-9 w-9 bg-surface shadow-floating"
        />
      )}

      {/* 固定保留一列高度給申請狀態 badge，不管有沒有顯示都佔同樣空間，
          這樣同一排卡片高度才會整齊，不會因為某幾張有 badge 就比其他張高 */}
      <div className="flex h-6 items-center justify-center">
        {(isMember || isApplied) && (
          <StatusBadge status={isMember ? 'member_joined' : 'pending'} label={isMember ? undefined : '審核中'} />
        )}
      </div>

      <div className="mt-2 flex justify-center">
        <ServiceLogo
          serviceId={group.serviceId}
          size={80}
          className="rounded-logo border-line-strong"
        />
      </div>

      <div className="mt-3 text-center">
        <h2 className="text-xl font-black leading-tight text-ink">{group.serviceName}</h2>
        <p className="mt-1 text-sm font-semibold text-ink-3">{group.planName}</p>
        <p className="mt-1 text-base font-extrabold text-ink">
          <TokenAmount
            amount={calcDisplayPrice(group.pricePerSeat, group.billingCycle)}
            cycle={calcDisplayCycle(group.billingCycle)}
          />
        </p>
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

      <div className="my-4 border-t border-line-subtle" />

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
                {group.openSeats <= 0 ? (
                  <span className="text-ink-3">{getStatusLabel('full')}</span>
                ) : (
                  <>
                    <span className={isLastSeat ? 'text-warning-text' : 'text-success'}>{group.openSeats}</span>
                    <span className="text-ink-4"> / {group.totalSeats}</span>
                  </>
                )}
              </p>
            </div>
            <Progress value={group.usedSeats} max={group.totalSeats} label="名額使用率" className="mt-1.5" />
          </>
        )}
      </div>

      {!hideActions && (
        <Button onClick={openDetails} className="mt-4 w-full">
          查看詳情
        </Button>
      )}

    </Card>
  )
}

export default memo(ExploreGroupCard, (prev, next) =>
  prev.group.id === next.group.id &&
  prev.group.status === next.group.status &&
  prev.group.openSeats === next.group.openSeats &&
  prev.group.usedSeats === next.group.usedSeats &&
  prev.group.totalSeats === next.group.totalSeats &&
  prev.group.pricePerSeat === next.group.pricePerSeat &&
  prev.group.planName === next.group.planName &&
  prev.group.tags?.join(',') === next.group.tags?.join(',') &&
  prev.isApplied === next.isApplied &&
  prev.isMember === next.isMember &&
  prev.hideActions === next.hideActions &&
  prev.rank === next.rank &&
  prev.onFavChange === next.onFavChange &&
  prev.onBeforeNavigate === next.onBeforeNavigate
)
