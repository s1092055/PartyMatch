import { Link } from "react-router-dom";

export function HostModeEmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-black/10 px-6 py-12 text-center">
      <div className="text-2xl font-semibold tracking-tight text-black">
        你還沒有建立任何群組
      </div>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/55">
        建立第一個共享群組，開始管理成員與申請。
      </p>
      <Link
        to="/create-group"
        className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
      >
        建立群組
      </Link>
    </div>
  );
}
