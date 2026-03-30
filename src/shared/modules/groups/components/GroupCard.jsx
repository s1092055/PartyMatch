import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { HeartIcon } from "@heroicons/react/24/outline";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { ProgressBar } from "../../../components/ui/ProgressBar.jsx";
import { ServiceIcon } from "../../../components/ui/ServiceIcon.jsx";
import { formatMoney } from "../../../../utils/format.js";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { useRequireAuthAction } from "../../auth/hooks/useRequireAuthAction.js";
import { useGroupsActions, useGroupsStore } from "../state/index.js";
import { getPlanById, getServiceById } from "../../../../data/services.config.js";
import { getGroupOccupancy, getPricePerSeatLabel } from "../utils/groupSummary.js";

function getRemainingSlots(g) {
  return Math.max(0, (g.totalSlots ?? 0) - (g.takenSlots ?? 0));
}

function getCardBadge(group, remaining) {
  if (Array.isArray(group.tags) && group.tags.length > 0) {
    return group.tags[0];
  }

  if (group.status === "expired") return "已截止";
  if (remaining <= 0) return "已滿團";
  if (remaining === 1) return "即將滿團";

  return "推薦";
}

function getBannerClass(group, remaining) {
  if (group.status === "expired") return "bg-black/[0.08] text-black/55";
  if (remaining <= 0) return "bg-black/[0.08] text-black/60";
  if (remaining === 1) return "bg-[#fff4d8] text-[#9a5a00]";
  if (group.tags?.includes("熱門")) return "bg-[#eef3ff] text-[#1d4ed8]";
  return "bg-black/[0.04] text-black/65";
}

function getRemainingToneClass(group, remaining) {
  if (group.status === "expired" || remaining <= 0) return "text-black/55";
  if (remaining === 1) return "text-[#9a5a00]";
  return "text-black/75";
}

function getCardPriceLabel(group, plan) {
  const helperLabel = getPricePerSeatLabel(group.serviceId, group.planId);
  if (helperLabel) {
    return `每位 ${helperLabel.replace(/^約\s*/, "").replace(/\s*\/\s*/g, "／")}`;
  }

  if (group.pricePerMonth != null) {
    const period =
      plan?.billingCycle === "yearly"
        ? "年"
        : plan?.billingCycle === "monthly"
          ? "月"
          : "";
    const currencyPrefix =
      group.currency === "USD" ? "US$" : group.currency === "TWD" ? "NT$" : `${group.currency ?? ""} `;

    return `每位 ${currencyPrefix}${formatMoney(group.pricePerMonth, group.currency)}${period ? `/${period}` : ""}`;
  }

  return "費用資訊待補充";
}

function PlatformAvatar({ platform, serviceId, iconKey }) {
  return (
    <div className="h-10 w-10 shrink-0 flex items-center justify-center">
      <ServiceIcon
        serviceId={serviceId}
        platform={platform}
        iconKey={iconKey}
        alt={platform}
        className="h-10 w-10 object-contain"
      />
    </div>
  );
}

export function GroupCard({ group, onClick, onJoin, actionLabel, actionVariant }) {
  const { state } = useGroupsStore();
  const { joinGroup, leaveGroup, toggleFollowGroup } = useGroupsActions();
  const { user } = useAuth();
  const requireAuthAction = useRequireAuthAction();
  const remaining = getRemainingSlots(group);
  const service = getServiceById(group.serviceId ?? group.platform);
  const plan = getPlanById(group.serviceId, group.planId);
  const occupancy = getGroupOccupancy(group);
  const serviceLabel = service?.name ?? service?.shortLabel ?? group.platform ?? "未設定服務";
  const planLabel = plan?.name ?? group.plan ?? "未設定方案";
  const priceLabel = getCardPriceLabel(group, plan);
  const isHosted = Boolean(user) && state.myGroups.hosted.includes(group.id);
  const isApplied = Boolean(user) && state.myGroups.joined.includes(group.id);
  const isFollowed = Boolean(user) && state.myGroups.followed.includes(group.id);
  const canApply = group.status !== "expired" && remaining > 0;
  const usesDetailAction = typeof onClick === "function" && !onJoin;
  const badgeLabel = getCardBadge(group, remaining);
  const bannerClass = getBannerClass(group, remaining);
  const remainingToneClass = getRemainingToneClass(group, remaining);

  function toggleFollow(event) {
    event.stopPropagation();
    requireAuthAction("請先登入後再追蹤群組。", () => {
      toggleFollowGroup(group.id);
    });
  }

  return (
    <Card
      className={[
        "relative z-0 w-full overflow-hidden p-0 transition-all duration-200 hover:z-10 hover:-translate-y-1 hover:shadow-lg",
        onClick ? "cursor-pointer focus-within:ring-2 focus-within:ring-black/10" : "",
      ].join(" ")}
      onClick={onClick}
    >
      <div
        className={[
          "px-4 py-2 text-center text-xs font-semibold tracking-[0.16em]",
          bannerClass,
        ].join(" ")}
      >
        {badgeLabel}
      </div>

      <div className="space-y-5 p-5">
        <div className="flex items-center gap-4">
          <PlatformAvatar
            platform={group.platform}
            serviceId={group.serviceId}
            iconKey={group.iconKey}
          />

          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-extrabold tracking-tight text-black">
              {serviceLabel}
            </div>
            <div className="mt-1 text-sm text-black/60">{planLabel}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-black/65">
            團主 <span className="font-semibold text-black/75">{group.hostName}</span>
          </div>

          <div className="text-sm text-black/60">
            <span>剩餘名額：</span>
            <span className={["font-semibold", remainingToneClass].join(" ")}>
              {occupancy.remainingSeats}
            </span>
          </div>

          <ProgressBar value={occupancy.progress} />
        </div>

        <div className="border-t border-black/10 pt-4 text-center">
          <span className="text-base font-semibold tracking-tight text-black">
            {priceLabel}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-black/10 pt-4">
          <button
            type="button"
            onClick={toggleFollow}
            className="inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-black"
            aria-label={isFollowed ? "取消收藏群組" : "收藏群組"}
          >
            {isFollowed ? (
              <HeartSolidIcon className="h-4 w-4 text-red-500" />
            ) : (
              <HeartIcon className="h-4 w-4" />
            )}
            <span>{isFollowed ? "已追蹤" : "加入追蹤"}</span>
          </button>

          <Button
            variant={
              usesDetailAction
                ? actionVariant ?? "outline"
                : isApplied
                  ? "outline"
                  : "primary"
            }
            disabled={usesDetailAction ? false : isHosted || (!isApplied && !canApply)}
            onClick={(event) => {
              event.stopPropagation();
              if (usesDetailAction) {
                onClick?.();
                return;
              }
              if (isHosted) return;
              if (isApplied) {
                requireAuthAction("請先登入後再管理你的群組申請。", () => {
                  leaveGroup(group.id);
                });
                return;
              }
              if (!canApply) return;
              if (
                !requireAuthAction("請先登入後再申請加入群組。")
              ) {
                return;
              }
              if (onJoin) {
                onJoin(group.id);
                return;
              }
              joinGroup(group.id);
            }}
            className={
              !usesDetailAction && (isHosted || (!isApplied && !canApply))
                ? "opacity-60"
                : ""
            }
          >
            {usesDetailAction
              ? actionLabel ?? "查看詳情"
              : isHosted
                ? "你是團主"
                : isApplied
                  ? "取消申請"
                  : "申請加入"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
