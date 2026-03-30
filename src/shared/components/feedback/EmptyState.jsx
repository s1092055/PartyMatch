export function EmptyState({
  title,
  description,
  action = null,
  className = "",
}) {
  return (
    <div
      className={[
        "rounded-[28px] border border-dashed border-black/10 bg-black/[0.015] px-6 py-12 text-center",
        className,
      ].join(" ")}
    >
      <div className="text-xl font-semibold tracking-tight text-black">{title}</div>
      {description ? (
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/55">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
