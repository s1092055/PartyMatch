import ServiceLogo from '../ServiceLogo'
import TokenAmount from '../TokenAmount'
import { calcDisplayPrice } from '../../../common/utils/pricingUtils'

// 我的訂閱／群組管理／探索群組三個群組卡片共用的外殼上半部：狀態 badge（固定保留一列高度，
// 不管有沒有內容都佔同樣空間，同一排卡片高度才會整齊）→ 服務 logo → 名稱/方案/價格 → 分隔線。
// topLeftSlot／topRightSlot 給探索群組卡片放排名徽章／收藏按鈕這類絕對定位的額外裝飾用。
export default function GroupCardHeader({
  badge, topLeftSlot, topRightSlot, belowPrice,
  serviceId, serviceName, planName, pricePerSeat, billingCycle,
}) {
  return (
    <>
      {topLeftSlot}
      {topRightSlot}

      <div className="flex h-6 items-center justify-center">{badge}</div>

      <div className="mt-3 flex justify-center">
        <ServiceLogo serviceId={serviceId} size={80} className="border-line-strong" />
      </div>

      <div className="mt-3 text-center">
        <h2 className="text-xl font-black leading-tight text-ink">{serviceName}</h2>
        <p className="mt-1 text-sm font-semibold text-ink-3">{planName}</p>
        <p className="mt-1 text-xl font-extrabold text-ink">
          <TokenAmount amount={calcDisplayPrice(pricePerSeat, billingCycle)} unit="/ 位" />
        </p>
      </div>

      {belowPrice && <div className="mt-3">{belowPrice}</div>}

      <div className={`my-4 border-t border-line-subtle ${belowPrice ? 'mx-2' : ''}`} />
    </>
  )
}
