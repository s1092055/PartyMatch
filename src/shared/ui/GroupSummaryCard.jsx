import ProgressBar from './ProgressBar'
import Badge from './Badge'
import { TagChip } from './GroupOverviewContent'
import { getInfoRows } from '../utils/groupDisplay'

// 群組詳情 modal 共用的右側摘要卡（每席價格／剩餘名額／標籤／資訊列），
// 探索頁、我的訂閱、群組管理三處共用同一份排版。
// favoriteSlot：收藏愛心按鈕，僅探索頁使用
// extraRows：角色專屬的額外資訊（例如我的付款狀態、計費週期），接在標準資訊列之後
// footer：底部行動按鈕區，三處各自不同（申請加入／標記已付款／啟用服務...）
export default function GroupSummaryCard({ group, favoriteSlot = null, extraRows = null, footer = null }) {
  const infoRows = getInfoRows(group)
  const tags = group.tags ?? []

  return (
    <div className="card divide-y divide-line-subtle overflow-hidden">
      <div className="flex items-start justify-between px-6 py-4 lg:px-8">
        <div>
          <p className="mb-0.5 text-xs font-medium text-ink-4">每席價格</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-ink">NT${group.pricePerSeat}</span>
            <span className="text-sm text-ink-3">/每月</span>
          </div>
        </div>
        {favoriteSlot}
      </div>

      <div className="px-6 py-4 lg:px-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-ink-3">剩餘名額</span>
          <span className="font-semibold text-ink">
            {group.openSeats} 位
          </span>
        </div>
        <ProgressBar value={group.usedSeats} max={group.totalSeats} />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 px-6 py-4 lg:px-8">
          {tags.map(tag => <TagChip key={tag} label={tag} />)}
        </div>
      )}

      {infoRows.length > 0 && (
        <div className="px-6 py-4 lg:px-8">
          <div className="space-y-2">
            {infoRows.map(({ label, value, badge }) => (
              <div key={label} className="flex gap-3 text-sm">
                <span className="w-14 shrink-0 text-ink-4">{label}</span>
                <span className="flex-1 text-ink-2">
                  {badge ? <Badge variant={badge} /> : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {extraRows}
      {footer}
    </div>
  )
}
