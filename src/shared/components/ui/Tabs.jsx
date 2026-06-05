export default function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 rounded-2xl bg-raised p-1 overflow-x-auto py-1.5 ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-sm font-bold transition-colors whitespace-nowrap ${
            active === tab.value
              ? 'bg-white text-ink shadow-sm'
              : 'text-ink-3 hover:text-ink'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              active === tab.value ? 'bg-slate-100 text-ink-2' : 'bg-slate-100 text-ink-3'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
