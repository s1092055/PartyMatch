import { Progress } from '../progress'
import TokenAmount from '../TokenAmount'
import { calcDisplayPrice, calcDisplayCycle } from '../../../common/utils/pricingUtils'

export default function GroupPriceSeatSummary({ group }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-0.5 text-xs font-medium text-ink-4">每位價格</p>
          <TokenAmount
            amount={calcDisplayPrice(group.pricePerSeat, group.billingCycle)}
            cycle={calcDisplayCycle(group.billingCycle)}
            className="text-2xl font-extrabold"
          />
        </div>
        <div className="text-right">
          <p className="mb-0.5 text-xs text-ink-4">剩餘名額</p>
          <p className="text-lg font-extrabold text-ink">{group.openSeats} / {group.totalSeats} 位</p>
        </div>
      </div>
      <div className="mt-3">
        <Progress value={group.usedSeats} max={group.totalSeats} />
      </div>
    </div>
  )
}
