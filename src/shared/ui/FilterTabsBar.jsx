import { Archive, Star } from 'lucide-react'
import CustomSelect from './primitives/CustomSelect'

function SidebarIconButton({ icon: Icon, label, badgeCount, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`relative grid shrink-0 place-items-center rounded-xl border border-line-subtle text-ink-3 transition-colors hover:bg-raised hover:text-ink ${className}`}
    >
      <Icon size={17} strokeWidth={1.5} />
      {badgeCount > 0 && (
        <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ink-4 px-1 text-2xs font-bold text-white">
          {badgeCount}
        </span>
      )}
    </button>
  )
}

export default function FilterTabsBar({ tabs, value, onChange, counts = {}, onOpenHistory, historyCount = 0, onOpenReviews }) {
  const options = tabs.map(tab => ({
    value: tab.key,
    label: counts[tab.key] != null ? `${tab.label} (${counts[tab.key]})` : tab.label,
  }))

  return (
    <>
      {/* Dropdown — mobile，我的評價／群組紀錄以 icon 按鈕放在右側 */}
      <div className="mb-4 flex items-center gap-2 md:hidden">
        <CustomSelect value={value} onChange={onChange} options={options} />
        {onOpenReviews && (
          <SidebarIconButton icon={Star} label="我的評價" onClick={onOpenReviews} className="h-11 w-11" />
        )}
        {onOpenHistory && (
          <SidebarIconButton icon={Archive} label="群組紀錄" badgeCount={historyCount} onClick={onOpenHistory} className="h-11 w-11" />
        )}
      </div>

      {/* 桌機版：左側垂直 tab 選單，樣式比照帳號設定頁；我的評價／群組紀錄固定在側邊欄底部。
          給 nav 固定高度（跟右側內容區的 max-h 用同一個 calc 值）而不是靠 flex 拉伸撐高，
          避免內容區高度隨分類項目多寡變化時，底部這兩顆按鈕的垂直位置跟著飄動 */}
      <nav className="hidden w-40 shrink-0 animate-step-slide-up md:flex md:h-[calc(100vh-16rem)] md:min-h-[28rem] md:flex-col">
        <ul className="flex flex-col gap-1">
          {tabs.map(tab => (
            <li key={tab.key}>
              <button
                onClick={() => onChange(tab.key)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                  value === tab.key
                    ? 'bg-brand-subtle text-brand'
                    : 'text-ink-2 hover:bg-raised hover:text-ink'
                }`}
              >
                <span className="text-left">{tab.label}</span>
                {counts[tab.key] != null && (
                  <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                    value === tab.key ? 'bg-brand/15 text-brand' : 'bg-raised text-ink-4'
                  }`}>
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {(onOpenReviews || onOpenHistory) && (
          <div className="mt-auto flex flex-col gap-1">
            {onOpenReviews && (
              <button
                onClick={onOpenReviews}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              >
                <Star size={16} strokeWidth={1.5} />
                我的評價
              </button>
            )}
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              >
                <span className="flex items-center gap-2">
                  <Archive size={16} strokeWidth={1.5} />
                  群組紀錄
                </span>
                {historyCount > 0 && (
                  <span className="rounded-full bg-raised px-1.5 py-0.5 text-xs font-bold text-ink-4">
                    {historyCount}
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </nav>
    </>
  )
}
