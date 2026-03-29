import { Progress } from '../progress'
import TokenAmount from '../TokenAmount'
import { calcDisplayPrice, calcDisplayCycle } from '../../../common/utils/pricingUtils'

export default function GroupPriceSeatSummary({ group }) {
  const isFull     = group.openSeats <= 0
  const isLastSeat = group.openSeats === 1
  const seatColor  = isFull ? 'text-ink-3' : isLastSeat ? 'text-warning-text' : 'text-success'
  const barColor   = isFull ? 'bg-ink-3' : isLastSeat ? 'bg-warning' : 'bg-success'

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-0.5 text-xs font-medium text-ink-4">每位價格</p>
          <TokenAmount
            amount={calcDisplayPrice(group.pricePerSeat, group.billingCycle)}
            cycle={calcDisplayCycle(group.billingCycle)}
            className="text-lg font-extrabold"
          />
        </div>
        <div className="text-right">
          <p className="mb-0.5 text-xs text-ink-4">剩餘名額</p>
          <p className="text-lg font-extrabold text-ink">
            <span className={seatColor}>{group.openSeats}</span>
            <span className="text-ink-4"> / {group.totalSeats} 位</span>
          </p>
        </div>
      </div>
      <div className="mt-3">
        <Progress value={group.usedSeats} max={group.totalSeats} color={barColor} />
      </div>
    </div>
  )
}
