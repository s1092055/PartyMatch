import CustomSelect from './CustomSelect'

export default function FilterTabsBar({ tabs, value, onChange, counts = {} }) {
  const options = tabs.map(tab => ({
    value: tab.key,
    label: counts[tab.key] != null ? `${tab.label} (${counts[tab.key]})` : tab.label,
  }))

  return (
    <>
      {/* Dropdown — mobile */}
      <div className="mb-4 md:hidden">
        <CustomSelect value={value} onChange={onChange} options={options} />
      </div>

      {/* 桌機版：左側垂直 tab 選單，樣式比照帳號設定頁 */}
      <nav className="hidden w-40 shrink-0 self-start md:block">
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
      </nav>
    </>
  )
}
