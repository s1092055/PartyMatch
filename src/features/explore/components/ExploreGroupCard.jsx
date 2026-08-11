import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import FavoriteToggleButton from '../../../components/ui/FavoriteToggleButton'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { getStatusLabel } from '../../../components/ui/statusBadgeConfig'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Progress } from '../../../components/ui/progress'
import GroupCardHeader from '../../../components/ui/group/GroupCardHeader'
import { StatCell, StatCellGrid } from '../../../components/ui/group/StatCellGrid'
import CreditScoreValue from '../../../components/ui/CreditScoreValue'
import { useFavoriteStore } from '../../../common/stores/useFavoriteStore'
import { useAuthStore } from '../../../common/stores/useAuthStore'

const RANK_BADGE_STYLES = [
  'bg-amber-400 text-white',
  'bg-slate-300 text-slate-700',
  'bg-orange-300 text-white',
]

// 剩餘名額改成卡片下方全寬顯示（不是三格裡的其中一格）：左邊數字隨額滿程度變色，
// 「/ 總名額」維持中性灰，下面搭一條同色的進度條。標籤跟數值都套用跟 StatCell 一樣的
// 三欄置中版位（左欄置中對齊團主、右欄置中對齊信用分數），單純用 justify-between 的話
// 文字會貼齊卡片邊緣，跟下面置中在各自欄位裡的團主／信用分數文字對不齊
function SeatSummary({ openSeats, totalSeats, usedSeats, isLastSeat }) {
  if (totalSeats == null) {
    return (
      <div className="grid grid-cols-3 items-baseline">
        <p className="text-center text-xs font-bold text-ink-3">剩餘名額</p>
        <span />
        <p className="text-center text-sm font-semibold text-ink-4">尚未設定</p>
      </div>
    )
  }

  const isFull    = openSeats <= 0
  const barColor  = isFull ? 'bg-ink-3' : isLastSeat ? 'bg-warning' : 'bg-success'

  return (
    <div>
      <div className="grid grid-cols-3 items-baseline">
        <p className="text-center text-xs font-bold text-ink-3">剩餘名額</p>
        <span />
        <p className="text-center text-sm font-black">
          {isFull ? (
            <span className="text-ink-3">{getStatusLabel('full')}</span>
          ) : (
            <>
              <span className={isLastSeat ? 'text-warning-text' : 'text-success'}>{openSeats}</span>
              <span className="text-ink-4"> / {totalSeats}</span>
            </>
          )}
        </p>
      </div>
      <Progress value={usedSeats} max={totalSeats} color={barColor} className="mx-6 mt-1.5" />
    </div>
  )
}

function ExploreGroupCard({ group, onFavChange, onBeforeNavigate, hideActions = false, isApplied = false, isMember = false, rank }) {
  const navigate = useNavigate()
  const activeUser = useAuthStore(s => s.user)
  const isFav = useFavoriteStore(s => activeUser ? s.isFavorited(activeUser.id, group.id) : false)

  const isLastSeat = group.openSeats === 1

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
      className="card-lift relative flex min-h-full cursor-pointer flex-col overflow-hidden p-5"
      onClick={openDetails}
    >
      <GroupCardHeader
        topLeftSlot={rank != null && (
          <span className={`absolute left-4 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold shadow-sm ${RANK_BADGE_STYLES[rank - 1] ?? RANK_BADGE_STYLES[2]}`}>
            {rank}
          </span>
        )}
        topRightSlot={!hideActions && (
          <FavoriteToggleButton
            isFav={isFav}
            onClick={handleFav}
            heartSize={18}
            className="absolute right-4 top-4 h-9 w-9 bg-surface shadow-floating"
            square
          />
        )}
        badge={(isMember || isApplied) && (
          <StatusBadge status={isMember ? 'member_joined' : 'pending'} label={isMember ? undefined : '審核中'} />
        )}
        serviceId={group.serviceId}
        serviceName={group.serviceName}
        planName={group.planName}
        pricePerSeat={group.pricePerSeat}
        billingCycle={group.billingCycle}
        belowPrice={(
          <SeatSummary
            openSeats={group.openSeats}
            totalSeats={group.totalSeats}
            usedSeats={group.usedSeats}
            isLastSeat={isLastSeat}
          />
        )}
      />

      <div className="mx-6">
        <StatCellGrid>
          <StatCell label="團主">{group.hostName ?? '—'}</StatCell>
          <StatCell label="建立日期">{group.createdAt ?? '—'}</StatCell>
          <StatCell label="信用分數"><CreditScoreValue score={group.minCreditScore} /></StatCell>
        </StatCellGrid>
      </div>

      {!hideActions && (
        <div className="mx-6 mt-auto pt-5">
          <Button onClick={openDetails} className="w-full">
            查看詳情
          </Button>
        </div>
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
  prev.isApplied === next.isApplied &&
  prev.isMember === next.isMember &&
  prev.hideActions === next.hideActions &&
  prev.rank === next.rank &&
  prev.onFavChange === next.onFavChange &&
  prev.onBeforeNavigate === next.onBeforeNavigate
)
