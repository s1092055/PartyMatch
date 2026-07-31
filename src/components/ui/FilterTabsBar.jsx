// 狀態篩選一律用橫向 tabs，手機/桌機同一套邏輯（不再用下拉選單，目前只有 3 個分類，
// 手機寬度也放得下）——「群組紀錄」按鈕放在頁面最上方的標題列，這裡不再處理
export default function FilterTabsBar({ tabs, value, onChange, counts = {} }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {tabs.map(tab => {
          const active = value === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`group relative -mb-px flex flex-1 items-center justify-center gap-1.5 px-3.5 py-2.5 text-sm font-bold transition-colors ${
                active ? 'text-brand' : 'text-ink-3 hover:text-ink'
              }`}
            >
              {tab.label}
              {counts[tab.key] != null && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  active ? 'bg-brand-subtle text-brand' : 'bg-raised text-ink-4'
                }`}>
                  {counts[tab.key]}
                </span>
              )}
              {/* 底線：當前分類固定顯示（切走時直接消失，不做退場動畫）；
                  其他分類只有 hover 進入時才有滑入動畫，滑出/切換不animate */}
              <span
                className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-brand ${
                  active
                    ? 'scale-x-100'
                    : 'scale-x-0 group-hover:scale-x-100 group-hover:transition-transform group-hover:duration-200'
                }`}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
