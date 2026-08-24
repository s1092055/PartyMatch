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

              <span
                className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-brand ${
                  active
                    ? 'scale-x-100'
                    : 'scale-x-0 group-hover:scale-x-100 group-hover:transition-transform group-hover:duration-200'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
