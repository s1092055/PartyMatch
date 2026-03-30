export function PageContainer({ children, className = "" }) {
  return (
    <div className={["w-full", className].join(" ")}>
      {children}
    </div>
  );
}
