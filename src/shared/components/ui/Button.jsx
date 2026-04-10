import { ArrowRightIcon } from "@heroicons/react/24/solid";

export function Button({ variant = "primary", hoverLabel, className = "", children, ...props }) {
  if (hoverLabel != null) {
    const interactiveStyles = {
      primary: {
        button:
          "border border-black/15 bg-black text-white shadow-[0_14px_30px_rgba(0,0,0,0.18)] hover:border-black/20",
        dot: "bg-white/92",
        hoverText: "text-black",
      },
      outline: {
        button:
          "border border-black/12 bg-white text-black shadow-[0_12px_28px_rgba(15,23,42,0.08)] hover:border-black/18",
        dot: "bg-black",
        hoverText: "text-white",
      },
    };

    const s = interactiveStyles[variant] ?? interactiveStyles.primary;

    return (
      <button
        className={[
          "group relative inline-flex h-14 min-w-[178px] items-center justify-center overflow-hidden rounded-full px-6 text-[15px] font-semibold transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-black/35 focus-visible:ring-offset-2 active:scale-[0.99]",
          s.button,
          className,
        ].join(" ")}
        {...props}
      >
        <span
          className={[
            "absolute left-5 top-1/2 z-0 h-3 w-3 -translate-y-1/2 rounded-full transition-all duration-300 ease-out group-hover:left-1.5 group-hover:h-[calc(100%-0.75rem)] group-hover:w-[calc(100%-0.75rem)] group-hover:rounded-full",
            s.dot,
          ].join(" ")}
        />
        <span className="relative z-10 block w-[116px] overflow-hidden text-center whitespace-nowrap">
          <span className="block transition-all duration-300 ease-out group-hover:-translate-x-3 group-hover:opacity-0">
            {children}
          </span>
          <span
            className={[
              "pointer-events-none absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100",
              s.hoverText,
            ].join(" ")}
            style={{ transform: "translateX(0.625rem)" }}
          >
            <span>{hoverLabel}</span>
            <ArrowRightIcon className="h-[18px] w-[18px] shrink-0" />
          </span>
        </span>
      </button>
    );
  }

  const base =
    "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";
  const styles = {
    primary: "bg-black text-white hover:bg-black/80",
    soft: "bg-black/[0.04] text-black/80 hover:bg-black/[0.07]",
    outline: "border border-black/15 bg-white text-black hover:bg-black/5",
  };

  return (
    <button
      className={[base, styles[variant], className].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
