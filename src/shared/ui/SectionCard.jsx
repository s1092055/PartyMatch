export default function SectionCard({ title, subtitle, action, children, className = '', flat = false }) {
  return (
    <div className={`${flat ? '' : 'card'} ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-line-subtle px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-ink">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}
