export function PageHeader({ eyebrow, title, description, className = "" }) {
  return (
    <div className={["mx-auto mb-10 max-w-6xl text-center", className].filter(Boolean).join(" ")}>
      {eyebrow ? <p className="text-sm text-black/50">{eyebrow}</p> : null}
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black">{title}</h1>
      {description ? <p className="mt-2 text-sm text-black/60">{description}</p> : null}
    </div>
  );
}
