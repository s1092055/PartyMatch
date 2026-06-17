import CustomSelect from './CustomSelect'

export default function FilterTabsBar({ tabs, value, onChange, counts = {} }) {
  const selectOptions = tabs.map(tab => ({
    value: tab.key,
    label: counts[tab.key] != null ? `${tab.label}（${counts[tab.key]}）` : tab.label,
  }))

  return (
    <>
      <div className="mb-4 sm:hidden">
        <CustomSelect options={selectOptions} value={value} onChange={onChange} />
      </div>

      <div className="mb-4 hidden min-w-0 justify-center overflow-x-auto py-1 sm:flex">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
                value === tab.key
                  ? 'bg-brand text-white'
                  : 'text-ink-3 hover:bg-raised hover:text-ink'
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
      </div>
    </>
  )
}
