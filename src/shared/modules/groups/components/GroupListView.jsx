import { MinusIcon } from "@heroicons/react/24/solid";
import { Badge } from "../../../components/ui/Badge.jsx";
import { ServiceIcon } from "../../../components/ui/ServiceIcon.jsx";
import {
  formatGroupCreatedDate,
  getGroupViewMeta,
} from "../utils/groupDisplayMeta.js";

function GroupListItem({
  item,
  onDraftOpen,
  onOpenGroup,
  deleteMode,
  onRequestRemove,
  renderSideContent,
  renderExpandedContent,
  isExpanded = false,
}) {
  const { service, plan, badge } = getGroupViewMeta(item);
  const isDraft = item.kind === "draft";
  const isClickable = !deleteMode && (isDraft || item.status !== "dissolved");
  const sideContent = renderSideContent?.(item) ?? null;
  const expandedContent = renderExpandedContent?.(item) ?? null;
  const handleOpen = () => {
    if (isDraft) {
      onDraftOpen?.(item);
      return;
    }

    onOpenGroup?.(item);
  };

  return (
    <div>
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
                "grid min-w-0 gap-4 text-left lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:items-center",
                isClickable ? "cursor-pointer" : "cursor-default",
              ].join(" ")}
            >
              {/* 群組 */}
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

              {/* 建立日期 */}
              <div className="grid gap-1 text-sm lg:block">
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-black/36 lg:hidden">
                  {isDraft ? "最後更新" : "建立日期"}
                </div>
                <div className="font-medium text-black">
                  {formatGroupCreatedDate(item.createdAt)}
                </div>
              </div>

              {/* 群組人數 */}
              <div className="grid gap-1 text-sm lg:block">
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-black/36 lg:hidden">
                  群組人數
                </div>
                <div className="font-medium text-black">
                  {isDraft ? "--" : `${item.takenSlots ?? 0} / ${item.totalSlots ?? 0}`}
                </div>
              </div>

              {/* 狀態 */}
              <div className="flex items-center">
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-black/36 lg:hidden">
                  狀態
                </div>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </div>
            </div>
          </div>

          {sideContent ? (
            <div className="flex w-11 shrink-0 items-center justify-end">{sideContent}</div>
          ) : (
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
          )}
        </div>
      </div>

      {isExpanded && expandedContent ? expandedContent : null}
    </div>
  );
}

export function GroupListView({
  groups,
  onDraftOpen,
  onOpenGroup,
  deleteMode = false,
  onRequestRemove,
  renderSideContent,
  renderExpandedContent,
  isItemExpanded,
}) {
  const showsSideContent = typeof renderSideContent === "function";

  return (
    <div className="overflow-hidden rounded-[24px] border border-black/8">
      <div className="hidden items-center gap-3 bg-black/[0.02] px-6 py-4 text-sm font-medium text-black/45 lg:flex">
        <div className="grid min-w-0 flex-1 grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 items-center">
          <div>群組種類</div>
          <div>建立日期</div>
          <div>人數</div>
          <div>狀態</div>
        </div>
        <div
          className={[
            showsSideContent
              ? "w-11 shrink-0"
              : [
                  "transition-all duration-200",
                  deleteMode ? "w-10 opacity-100" : "w-0 opacity-0",
                ].join(" "),
          ].join(" ")}
        />
      </div>

      <div className="divide-y divide-black/8">
        {groups.map((group) => (
          <GroupListItem
            key={group.id}
            item={group}
            onDraftOpen={onDraftOpen}
            onOpenGroup={onOpenGroup}
            deleteMode={deleteMode}
            onRequestRemove={onRequestRemove}
            renderSideContent={renderSideContent}
            renderExpandedContent={renderExpandedContent}
            isExpanded={isItemExpanded?.(group) ?? false}
          />
        ))}
      </div>
    </div>
  );
}
