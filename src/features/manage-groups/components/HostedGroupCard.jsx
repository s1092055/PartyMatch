import { memo } from 'react'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { getStatusTextColor } from '../../../components/ui/statusBadgeConfig'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import ServiceLogo from '../../../components/ui/ServiceLogo'
import TokenAmount from '../../../components/ui/TokenAmount'
import { getRenewalAwareStatus } from '../../../common/utils/groupStatusDisplay'
import { toISODate } from '../../../common/utils/date'
import { calcDisplayPrice, calcDisplayCycle } from '../../../common/utils/pricingUtils'
import { getServiceById } from '../../../common/utils/serviceUtils'

// 這裡的文字刻意跟 Badge.jsx 的 LABELS 分開維護：StatCell 用的是稍微更完整的描述用語
// （例如「待啟用服務」而非 Badge 的「待啟用」），且這裡多了 Badge 沒有的「追蹤中」「正常」兩種細分狀態，
// 不是單純複製 Badge 的狀態字典，改動任一邊文字前請先確認另一邊的用語脈絡
function getCollectionState({ group, paidCount, paymentTarget }) {
  if (['cancelled', 'ended'].includes(group.status)) return '已結束'
  if (group.status === 'recruiting') return '招募中'
  if (group.status === 'full') return '已滿員'
  if (group.status === 'pending_confirmation') return '處理中'
  if (group.status === 'pending_activation') return '待啟用服務'
  if (group.status === 'confirming') return '確認期中'
  if (group.status === 'disputed') return '問題處理中'
  if (paymentTarget > 0 && paidCount < paymentTarget && group.status === 'active') return '追蹤中'
  return '正常'
}

function StatCell({ label, children, onClick, highlight }) {
  const content = (
    <div className="flex flex-col items-center gap-0.5 py-2.5 text-center">
      <span className="text-2xs font-bold text-ink-3">{label}</span>
      <span className={`text-sm font-black leading-tight ${highlight ?? 'text-ink'}`}>{children}</span>
    </div>
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onClick() }}
        className="w-full rounded-lg hover:bg-raised hover:-translate-y-0.5 transition-all"
      >
        {content}
      </button>
    )
  }
  return content
}

function HostedGroupCard({
  group,
  members,
  pendingAppCount,
  paymentCount,
  onViewGroup,
}) {
  const displayStatus = getRenewalAwareStatus(group.status, group.nextBillingDate)
  const isSharedCredentials = getServiceById(group.serviceId)?.sharingMethod === 'shared_credentials'

  const collectionState = getCollectionState({ group, paidCount: 0, paymentTarget: members.length })

  // 確認期中／問題處理中的顏色向 Badge.jsx 拿，避免兩邊各自維護一份對照表而配色跑掉；
  // 其餘幾種是 getCollectionState 自己組出來的細分狀態，沒有對應的單一 group.status，維持手動指定顏色
  const collectionHighlight = {
    '正常':      'text-success-text',
    '招募中':    'text-success-text',
    '已結束':    'text-ink-3',
    '已滿員':    'text-ink-3',
    '確認期中':  getStatusTextColor('confirming'),
    '問題處理中': getStatusTextColor('disputed'),
  }[collectionState] ?? 'text-warning-text'

  const isActivated    = ['active', 'cancelled', 'ended'].includes(group.status)

  return (
    <Card
      as="article"
      className="card-lift relative flex min-h-full cursor-pointer flex-col overflow-hidden p-5"
      onClick={onViewGroup}
    >
      <div className="flex justify-center">
        <StatusBadge
          status={displayStatus}
          label={
            group.status === 'full' ? '等待鎖定' :
            group.status === 'pending_confirmation' && isSharedCredentials ? '成員提取中' :
            undefined
          }
        />
      </div>

      <div className="mt-4 flex justify-center">
        <ServiceLogo serviceId={group.serviceId} size={80} className="border-line-strong" />
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

      <div className="my-4 border-t border-line-subtle" />

      <div className="grid grid-cols-3 divide-x divide-line-subtle rounded-lg border border-line-subtle">
        {group.status === 'active' ? (
          <StatCell label="群組狀態" highlight={collectionHighlight}>
            {collectionState}
          </StatCell>
        ) : isActivated ? (
          <StatCell label="收款紀錄">
            {paymentCount} 件
          </StatCell>
        ) : group.status === 'recruiting' ? (
          <StatCell
            label="待處理申請"
            highlight={pendingAppCount > 0 ? 'text-brand' : undefined}
          >
            {pendingAppCount} 件
          </StatCell>
        ) : (
          <StatCell label="群組狀態" highlight={collectionHighlight}>
            {collectionState}
          </StatCell>
        )}
        <StatCell label="群組人數">
          {members.length + 1} 人
        </StatCell>
        {group.status === 'active' ? (
          <StatCell label="續訂日期">
            {toISODate(group.nextBillingDate, '—')}
          </StatCell>
        ) : group.status === 'recruiting' || group.status === 'cancelled' || group.status === 'ended' ? (
          // 已解散／已結束的群組上方已經有對應 badge 了，這裡不重複顯示群組狀態，
          // 改跟招募中一樣顯示建立日期
          <StatCell label="建立日期">
            {group.createdAt ?? '—'}
          </StatCell>
        ) : isActivated ? (
          <StatCell label="群組狀態" highlight={collectionHighlight}>
            {collectionState}
          </StatCell>
        ) : group.status === 'pending_confirmation' || group.status === 'pending_activation' ? (
          // 鎖定當下算出來的日期只是預估，真正定案要等啟用服務那一步重新計算
          <StatCell label="預估下次扣款">
            {toISODate(group.nextBillingDate, '—')}
          </StatCell>
        ) : (
          <StatCell label="下次扣款">
            {toISODate(group.nextBillingDate, '—')}
          </StatCell>
        )}
      </div>

      <div className="mt-auto pt-5">
        <Button
          onClick={e => { e.stopPropagation(); onViewGroup?.() }}
          className="w-full"
        >
          查看群組
        </Button>
      </div>
    </Card>
  )
}

export default memo(HostedGroupCard, (prev, next) =>
  prev.group.id === next.group.id &&
  prev.group.status === next.group.status &&
  prev.group.usedSeats === next.group.usedSeats &&
  prev.group.openSeats === next.group.openSeats &&
  prev.group.nextBillingDate === next.group.nextBillingDate &&
  prev.pendingAppCount === next.pendingAppCount &&
  prev.paymentCount === next.paymentCount &&
  prev.members.length === next.members.length &&
  prev.onViewGroup === next.onViewGroup
)
