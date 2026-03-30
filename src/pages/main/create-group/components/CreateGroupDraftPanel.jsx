import { formatSavedAt } from "../../../../utils/format.js";

export function CreateGroupDraftPanel({
  draft,
  onResume,
  onStartFresh,
  showCreateNewButton = true,
  showDeleteButton = false,
  onDelete,
  className = "",
}) {
  const savedAtLabel = formatSavedAt(draft?.savedAt, "剛剛");

  return (
    <div
      className={[
        "w-full rounded-[36px] border border-black/10 bg-white/96 p-7 shadow-[0_32px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-10",
        className,
      ].join(" ")}
    >
      <div className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-black/42">
        發現草稿
      </div>

      <div className="mt-5 max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
          要繼續上次的建立流程嗎？
        </h2>
        <p className="mt-4 text-base leading-8 text-black/58 sm:text-lg">
          最後更新於 {savedAtLabel}
          。你可以直接回到上次停留的步驟，也可以清除草稿，重新建立新的共享群組。
        </p>
      </div>

      <div className="mt-8 grid gap-4 rounded-[28px] border border-black/8 bg-black/[0.02] p-5 sm:grid-cols-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-black/36">
            目前進度
          </div>
          <div className="mt-2 text-lg font-semibold text-black">
            第 {draft.step + 1} 步
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-black/36">
            服務 / 方案
          </div>
          <div className="mt-2 text-lg font-semibold text-black">
            {draft.serviceLabel}
          </div>
          <div className="mt-1 text-sm text-black/54">{draft.planLabel}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-black/36">
            已填資料
          </div>
          <div className="mt-2 text-sm leading-7 text-black/58">
            開放名額、群組簡介、加入條件與申請須知
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        {showCreateNewButton ? (
          <button
            type="button"
            onClick={onStartFresh}
            className="inline-flex items-center justify-center rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/[0.03]"
          >
            建立新的群組
          </button>
        ) : null}
        <button
          type="button"
          onClick={onResume}
          className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-black/85"
        >
          開啟上次草稿
        </button>
        {showDeleteButton ? (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center rounded-full border border-[#f5c5bf] bg-[#fff4f2] px-5 py-3 text-sm font-semibold text-[#c2410c] transition hover:bg-[#ffe9e5]"
          >
            刪除草稿
          </button>
        ) : null}
      </div>
    </div>
  );
}
