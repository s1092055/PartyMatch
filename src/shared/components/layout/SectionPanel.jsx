export function SectionPanel({
  title,
  description,
  action,
  children,
  className = "",
}) {
  return (
    <section
      className={[
        "rounded-[28px] border border-black/10 bg-white px-6 py-6 sm:px-8 sm:py-8",
        className,
      ].join(" ")}
    >
      {(title || description || action) ? (
        <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-2xl font-bold tracking-tight text-black">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60 sm:text-base">
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
