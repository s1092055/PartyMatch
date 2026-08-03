const TONE_CLASSES = {
  danger: 'text-danger hover:bg-danger-subtle',
  brand:  'text-brand hover:bg-brand-subtle',
  default: 'text-ink-2 hover:bg-raised',
}

export default function GroupModalSideBarItem({ active, tone, pinned = false, onClick, className = '', children }) {
  const toneCls = active
    ? 'bg-brand-subtle text-brand'
    : TONE_CLASSES[tone] ?? TONE_CLASSES.default

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-2xs font-semibold transition-all hover:-translate-y-0.5 md:flex-none ${pinned ? 'md:mt-auto' : ''} ${toneCls} ${className}`}
    >
      {children}
    </button>
  )
}
