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

      {/* Pills — tablet & desktop */}
      <div className="mb-4 hidden gap-2 py-1 md:flex">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              value === tab.key
                ? 'bg-brand text-white'
                : 'bg-raised/50 text-ink-3 hover:bg-raised hover:text-ink'
            }`}
          >
            {tab.label}
            {counts[tab.key] != null && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                value === tab.key ? 'bg-white/20 text-white' : 'bg-raised text-ink-4'
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
