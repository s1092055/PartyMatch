export function LoadingSpinner({ label = "載入中..." }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-[#2563eb]" />
      <p className="text-sm text-black/55">{label}</p>
    </div>
  );
}
