export function PageHeader({ eyebrow, title, description, className = "" }) {
  return (
    <div className={["mb-10 max-w-6xl", className].filter(Boolean).join(" ")}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/36">{eyebrow}</p>
      ) : null}
      <h1 className="mt-3 text-3xl font-bold tracking-[-0.01em] text-[#111110] sm:text-4xl">{title}</h1>
      {description ? <p className="mt-2.5 text-sm leading-6 text-black/52">{description}</p> : null}
    </div>
  );
}
