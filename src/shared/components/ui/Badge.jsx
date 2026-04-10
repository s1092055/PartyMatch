export function Badge({ tone = "green", children }) {
  const styles = {
    green: "bg-[#ecfdf3] text-[#067647]",
    blue: "bg-black/[0.05] text-black",
    yellow: "bg-[#fff7df] text-[#b45309]",
    red: "bg-[#feeceb] text-[#b42318]",
    gray: "bg-black/5 text-black/60",
  };
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        styles[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
