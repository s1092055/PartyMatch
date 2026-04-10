export function GroupDetailSection({
  eyebrow,
  title,
  description,
  headingClassName = "max-w-3xl",
  className = "",
  children,
}) {
  return (
    <section className={["border-t border-black/8 pt-8", className].join(" ").trim()}>
      <div className={headingClassName}>
        {eyebrow ? (
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/38">
            {eyebrow}
          </div>
        ) : null}
        {title ? (
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-black">{title}</h2>
        ) : null}
        {description ? (
          <p className="mt-3 text-sm leading-7 text-black/55">{description}</p>
        ) : null}
      </div>

      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
