import CustomSelect from './CustomSelect'

export default function FilterTabsBar({ tabs, value, onChange, counts = {} }) {
  const options = tabs.map(tab => ({
    value: tab.key,
    label: counts[tab.key] != null ? `${tab.label} (${counts[tab.key]})` : tab.label,
  }))

  return (
    <>
      {/* Dropdown — mobile & tablet */}
      <div className="mb-4 lg:hidden">
        <CustomSelect value={value} onChange={onChange} options={options} />
      </div>

      {/* Pills — desktop */}
      <div className="mb-4 hidden justify-center gap-1.5 overflow-x-auto py-1 lg:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              value === tab.key
                ? 'scale-105 bg-raised text-ink'
                : 'bg-transparent text-ink-2 hover:scale-105 hover:bg-raised hover:text-ink'
            }`}
          >
            {tab.label}
            {counts[tab.key] != null && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                value === tab.key ? 'bg-ink/10 text-ink-2' : 'bg-raised text-ink-4'
              }`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>
    </>
  )
}
