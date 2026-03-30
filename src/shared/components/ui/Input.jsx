export function Input({ className = "", ...props }) {
  return (
    <input
      className={[
        "w-full rounded-full border border-black/10 bg-white px-4 py-3 text-sm",
        "outline-none focus:ring-2 focus:ring-[#2563eb]/20",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
