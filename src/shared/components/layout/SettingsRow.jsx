export function SettingsRow({
  label,
  value,
  description,
  actionLabel = "編輯",
  onAction,
  actionHref,
}) {
  const actionClass =
    "inline-flex items-center rounded-full border border-black/10 px-3 py-1.5 text-sm font-medium text-black transition hover:bg-black/5";

  return (
    <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-base font-semibold text-black">{label}</div>
        {value ? <div className="mt-1 text-sm text-black/65">{value}</div> : null}
        {description ? (
          <div className="mt-1 text-sm leading-6 text-black/50">{description}</div>
        ) : null}
      </div>

      {actionHref ? (
        <a href={actionHref} className={actionClass}>
          {actionLabel}
        </a>
      ) : (
        <button type="button" className={actionClass} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
