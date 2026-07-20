import { Archive } from 'lucide-react'
import CustomSelect from './CustomSelect'

function HistoryButton({ onOpenHistory, historyCount, className = '' }) {
  return (
    <button
      onClick={onOpenHistory}
      aria-label="群組紀錄"
      className={`relative grid shrink-0 place-items-center rounded-xl border border-line-subtle text-ink-3 transition-colors hover:bg-raised hover:text-ink ${className}`}
    >
      <Archive size={17} strokeWidth={1.5} />
      {historyCount > 0 && (
        <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ink-4 px-1 text-2xs font-bold text-white">
          {historyCount}
        </span>
      )}
    </button>
  )
}

export default function FilterTabsBar({ tabs, value, onChange, counts = {}, onOpenHistory, historyCount = 0 }) {
  const options = tabs.map(tab => ({
    value: tab.key,
    label: counts[tab.key] != null ? `${tab.label} (${counts[tab.key]})` : tab.label,
  }))

  return (
    <>
      {/* Dropdown — mobile，群組紀錄以 icon 按鈕放在右側 */}
      <div className="mb-4 flex items-center gap-2 md:hidden">
        <CustomSelect value={value} onChange={onChange} options={options} />
        {onOpenHistory && (
          <HistoryButton onOpenHistory={onOpenHistory} historyCount={historyCount} className="h-11 w-11" />
        )}
      </div>

      {/* 桌機版：左側垂直 tab 選單，樣式比照帳號設定頁；群組紀錄固定在側邊欄底部 */}
      <nav className="hidden w-40 shrink-0 animate-step-slide-up md:flex md:flex-col">
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

        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="mt-auto flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-ink-3 transition-colors hover:bg-raised hover:text-ink"
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
      </nav>
    </>
  )
}
