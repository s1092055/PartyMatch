import {
  ListBulletIcon,
  PlusIcon,
  Squares2X2Icon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const VIEW_OPTIONS = [
  { value: "list", label: "列表檢視", icon: ListBulletIcon },
  { value: "grid", label: "卡片檢視", icon: Squares2X2Icon },
];

export function CreateGroupToolbar({
  title,
  description,
  viewMode,
  onViewModeChange,
  onCreate,
  deleteMode,
  onToggleDeleteMode,
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-black/8 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="text-lg font-semibold text-black">{title}</div>
        {description ? <p className="mt-1 text-sm text-black/55">{description}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-black/10 bg-black/[0.02] p-1">
          {VIEW_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = option.value === viewMode;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onViewModeChange(option.value)}
                aria-pressed={isActive}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-white text-black shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                    : "text-black/58 hover:text-black",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/85 active:scale-[0.99]"
        >
          <PlusIcon className="h-4 w-4" />
          <span>建立群組</span>
        </button>

        <button
          type="button"
          onClick={onToggleDeleteMode}
          aria-pressed={deleteMode}
          aria-label={deleteMode ? "結束移除模式" : "進入移除模式"}
          className={[
            "inline-flex h-12 w-12 items-center justify-center rounded-full border text-sm transition-all duration-200 active:scale-[0.96]",
            deleteMode
              ? "border-[#fecaca] bg-[#fff1f2] text-[#dc2626] shadow-[0_10px_20px_rgba(220,38,38,0.12)] scale-[1.03] -rotate-6"
              : "border-black/10 bg-white text-black/62 hover:border-black/16 hover:text-black hover:scale-[1.02]",
          ].join(" ")}
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
