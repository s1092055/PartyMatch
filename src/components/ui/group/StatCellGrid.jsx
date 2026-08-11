export function StatCell({ label, children, onClick, highlight }) {
  const content = (
    <div className="flex min-w-0 flex-col items-center gap-0.5 py-2.5 text-center">
      <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-2xs font-bold text-ink-3">{label}</span>
      <span className={`max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs font-black leading-tight ${highlight ?? 'text-ink'}`}>{children}</span>
    </div>
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onClick() }}
        className="w-full rounded-lg transition-all hover:-translate-y-0.5 hover:bg-raised"
      >
        {content}
      </button>
    )
  }
  return content
}

// 群組卡片共用的三格資訊列（我的訂閱／群組管理／探索群組都用同一份），
// 固定三欄、欄與欄之間用分隔線隔開
export function StatCellGrid({ children }) {
  return (
    <div className="grid grid-cols-3 divide-x divide-line-subtle rounded-lg border border-line-subtle">
      {children}
    </div>
  )
}
