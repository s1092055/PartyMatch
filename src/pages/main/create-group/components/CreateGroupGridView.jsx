import { MinusIcon } from "@heroicons/react/24/solid";
import { Badge } from "../../../../shared/components/ui/Badge.jsx";
import { Card } from "../../../../shared/components/ui/Card.jsx";
import { ServiceIcon } from "../../../../shared/components/ui/ServiceIcon.jsx";
import {
  formatCreateGroupCreatedDate,
  getCreateGroupViewMeta,
} from "../utils/createGroupHomeView.js";

function getSeatMeta(group) {
  const total = Number(group.totalSlots ?? group.maxMembers ?? 0);
  const taken = Number(group.takenSlots ?? group.currentMembers ?? group.joinedSeats ?? 0);
  const remaining =
    typeof group.availableSeats === "number" ? group.availableSeats : Math.max(0, total - taken);

  return {
    total: total || "--",
    remaining,
  };
}

function CreateGroupGridCard({
  item,
  onDraftOpen,
  onOpenGroup,
  deleteMode,
  onRequestRemove,
}) {
  const { service, plan, badge } = getCreateGroupViewMeta(item);
  const seatMeta = getSeatMeta(item);
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
    <div className="flex items-stretch gap-3">
      <div
        className={[
          "min-w-0 flex-1 transition-transform duration-200",
          deleteMode ? "-translate-x-1" : "",
        ].join(" ")}
      >
        <Card
          className={[
            "h-full rounded-[24px] border-black/10 p-5 transition",
            isClickable ? "hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(15,23,42,0.1)]" : "",
          ].join(" ")}
        >
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
              "block w-full text-left",
              isClickable ? "cursor-pointer" : "cursor-default",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/[0.03]">
                  <ServiceIcon
                    serviceId={item.serviceId}
                    platform={item.platform}
                    iconKey={item.iconKey}
                    alt={service?.shortLabel ?? item.platform}
                    className="h-9 w-9 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold tracking-tight text-black">
                    {service?.shortLabel ?? item.platform}
                  </div>
                  <div className="mt-1 truncate text-sm text-black/54">
                    {plan?.name ?? item.plan ?? "--"}
                  </div>
                </div>
              </div>

              <Badge tone={badge.tone}>{badge.label}</Badge>
            </div>

            <div className="mt-5">
              <div className="text-lg font-semibold tracking-tight text-black">
                {item.title}
              </div>
              <p className="mt-2 text-sm leading-6 text-black/56">
                {isDraft ? "最後更新於 " : "建立於 "}
                {formatCreateGroupCreatedDate(item.createdAt)}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 rounded-[20px] bg-black/[0.025] p-4">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-black/36">
                  席次
                </div>
                <div className="mt-1 text-sm font-semibold text-black">{seatMeta.total}</div>
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-black/36">
                  尚可招募
                </div>
                <div className="mt-1 text-sm font-semibold text-black">{seatMeta.remaining}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div
        className={[
          "flex items-center overflow-hidden transition-all duration-200",
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
  );
}

export function CreateGroupGridView({
  groups,
  onDraftOpen,
  onOpenGroup,
  deleteMode = false,
  onRequestRemove,
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <CreateGroupGridCard
          key={group.id}
          item={group}
          onDraftOpen={onDraftOpen}
          onOpenGroup={onOpenGroup}
          deleteMode={deleteMode}
          onRequestRemove={onRequestRemove}
        />
      ))}
    </div>
  );
}
