export function SectionPanel({
  title,
  description,
  action,
  children,
  className = "",
}) {
  return (
    <section className={["pb-6 sm:pb-8", className].join(" ")}>
      {(title || description || action) ? (
        <div className="flex flex-col gap-4 border-b border-black/8 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-lg font-semibold text-black">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 max-w-2xl text-sm text-black/55">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}

      <div className={title || description || action ? "pt-6" : ""}>{children}</div>
    </section>
  );
}
