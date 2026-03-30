import { MinusIcon } from "@heroicons/react/24/solid";
import { Badge } from "../../../../shared/components/ui/Badge.jsx";
import { ServiceIcon } from "../../../../shared/components/ui/ServiceIcon.jsx";
import {
  formatCreateGroupCreatedDate,
  getCreateGroupViewMeta,
} from "../utils/createGroupHomeView.js";

function CreateGroupListItem({
  item,
  onDraftOpen,
  onOpenGroup,
  deleteMode,
  onRequestRemove,
}) {
  const { service, plan, badge } = getCreateGroupViewMeta(item);
  const isDraft = item.kind === "draft";
  const isClickable = !deleteMode && (isDraft || item.status !== "dissolved");
  const handleOpen = () => {
    if (isDraft) {
      onDraftOpen?.(item);
      return;
    }

    onOpenGroup?.(item);
  };

  return (
    <div
      className={[
        "px-5 py-5 transition sm:px-6",
        isClickable ? "hover:bg-black/[0.015]" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          role={isClickable ? "button" : undefined}
          tabIndex={isClickable ? 0 : undefined}
          onClick={isClickable ? handleOpen : undefined}
          onKeyDown={
            isClickable
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpen();
                  }
                }
              : undefined
          }
          className={[
            "min-w-0 flex-1 transition-transform duration-200",
            deleteMode ? "-translate-x-1" : "",
          ].join(" ")}
        >
          <div
            className={[
              "grid min-w-0 gap-4 text-left lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)_110px_132px] lg:items-center",
            isClickable ? "cursor-pointer" : "cursor-default",
          ].join(" ")}
          >
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-black/[0.03]">
                <ServiceIcon
                  serviceId={item.serviceId}
                  platform={item.platform}
                  iconKey={item.iconKey}
                  alt={service?.shortLabel ?? item.platform}
                  className="h-10 w-10 object-contain"
                />
              </div>

              <div className="min-w-0">
                <div className="truncate text-base font-semibold tracking-tight text-black">
                  {service?.shortLabel ?? item.platform}
                </div>
                <div className="mt-1 truncate text-sm text-black/56">
                  {item.title}
                </div>
              </div>
            </div>

            <div className="grid min-w-0 gap-1 text-sm lg:block">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-black/36 lg:hidden">
                方案類型
              </div>
              <div className="truncate font-medium text-black">{plan?.name ?? item.plan ?? "--"}</div>
              <div className="truncate text-black/48">
                {item.billingCycle === "yearly" ? "年繳" : "月繳"}
              </div>
            </div>

            <div className="grid gap-1 text-sm lg:block">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-black/36 lg:hidden">
                {isDraft ? "最後更新" : "建立日期"}
              </div>
              <div className="font-medium text-black">
                {formatCreateGroupCreatedDate(item.createdAt)}
              </div>
            </div>

            <div className="flex items-center lg:justify-end">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-black/36 lg:hidden">
                狀態
              </div>
              <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div
          className={[
            "overflow-hidden transition-all duration-200",
            deleteMode ? "w-10 opacity-100" : "w-0 opacity-0 pointer-events-none",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={() => onRequestRemove?.(item)}
            aria-label={`移除${item.title}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#dc2626] text-white transition hover:bg-[#b91c1c] active:scale-[0.96]"
          >
            <MinusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreateGroupListView({
  groups,
  onDraftOpen,
  onOpenGroup,
  deleteMode = false,
  onRequestRemove,
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-black/8">
      <div className="hidden items-center gap-3 bg-black/[0.02] px-6 py-4 text-sm font-medium text-black/45 lg:flex">
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)_110px_132px] gap-4 items-center">
          <div>群組</div>
          <div>方案類型</div>
          <div>時間</div>
          <div className="justify-self-end">狀態</div>
        </div>
        <div
          className={[
            "transition-all duration-200",
            deleteMode ? "w-10 opacity-100" : "w-0 opacity-0",
          ].join(" ")}
        />
      </div>

      <div className="divide-y divide-black/8">
        {groups.map((group) => (
          <CreateGroupListItem
            key={group.id}
            item={group}
            onDraftOpen={onDraftOpen}
            onOpenGroup={onOpenGroup}
            deleteMode={deleteMode}
            onRequestRemove={onRequestRemove}
          />
        ))}
      </div>
    </div>
  );
}
