export function ProgressBar({ value = 0, className = "", fillClassName = "" }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div className={["h-2 w-full overflow-hidden rounded-full bg-black/5", className].filter(Boolean).join(" ")}>
      <div
        className={["h-full rounded-full bg-[#2563eb]/60 transition-[width] duration-300", fillClassName].filter(Boolean).join(" ")}
        style={{ width: `${pct}%` }}
        aria-label={`已填滿 ${pct}%`}
      />
    </div>
  );
}
