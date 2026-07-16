export default function GroupModalSideBarItem({ active, tone, pinned = false, onClick, className = '', children }) {
  const toneCls = active
    ? 'bg-brand-subtle text-brand'
    : tone === 'danger'
      ? 'text-danger hover:bg-danger-subtle'
      : tone === 'brand'
        ? 'text-brand hover:bg-brand-subtle'
        : 'text-ink-2 hover:bg-raised'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-2xs font-semibold transition-colors md:flex-none ${pinned ? 'md:mt-auto' : ''} ${toneCls} ${className}`}
    >
      {children}
    </button>
  )
}
