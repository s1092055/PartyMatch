const sizeMap = {
  narrow: "max-w-3xl",
  reading: "max-w-4xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
  full: "max-w-none",
};

export function SmartContainer({ children, size = "default", className = "" }) {
  const maxWidth = sizeMap[size] || sizeMap.default;

  return <div className={["mx-auto w-full", maxWidth, className].join(" ")}>{children}</div>;
}
