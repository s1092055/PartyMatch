export function Card({ className = "", children, ...props }) {
  return (
    <div
      className={[
        "rounded-[18px] border border-black/10 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.05)]",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
