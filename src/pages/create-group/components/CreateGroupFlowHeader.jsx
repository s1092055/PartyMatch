import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { formatSavedAt } from "../../../shared/utils/format.js";

export function CreateGroupFlowHeader({
  onExit,
  lastSavedAt,
  exitLabel = "",
}) {
  const savedAtLabel = formatSavedAt(lastSavedAt);
  const showsTextLabel = Boolean(exitLabel);

  return (
    <header className="shrink-0 border-b border-black/8 bg-white">
      <div className="mx-auto flex h-20 w-full max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onExit}
            className={[
              "inline-flex shrink-0 items-center justify-center border border-black/10 bg-white text-black/70 transition hover:bg-black/[0.03] hover:text-black",
              showsTextLabel
                ? "gap-2 rounded-full px-4 py-2.5 text-sm font-medium"
                : "h-11 w-11 rounded-full",
            ].join(" ")}
            aria-label={exitLabel || "離開建立流程"}
          >
            <ArrowLeftIcon className="h-5 w-5" />
            {showsTextLabel ? <span>{exitLabel}</span> : null}
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {savedAtLabel ? (
            <div className="hidden rounded-full border border-black/8 bg-black/[0.02] px-3 py-2 text-xs text-black/52 md:inline-flex">
              最近儲存於 {savedAtLabel}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
