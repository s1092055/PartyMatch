import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { HeartIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { ProgressBar } from "../../../components/ui/ProgressBar.jsx";
import { ServiceIcon } from "../../../components/ui/ServiceIcon.jsx";
import { formatMoney } from "../../../utils/format.js";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { useRequireAuthAction } from "../../auth/hooks/useRequireAuthAction.js";
import { useGroupsActions, useGroupsStore } from "../state/index.js";
import { useToast } from "../../../hooks/useToast.js";
import { getPlanById, getServiceById } from "../../../../data/services.config.js";
import {
  getGroupOccupancy,
  getPricePerSeatLabel,
  getRemainingSeatStatusTheme,
} from "../utils/groupSummary.js";


function getRemainingSlots(g) {
  return Math.max(0, (g.totalSlots ?? 0) - (g.takenSlots ?? 0));
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
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-black/6 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
    >
      <ServiceIcon
        serviceId={serviceId}
        platform={platform}
        iconKey={iconKey}
        alt={platform}
        className="h-8 w-8 object-contain"
      />
    </div>
  );
}

export function GroupCard({ group, onClick, onJoin, actionLabel, actionVariant, className = "" }) {
  const navigate = useNavigate();
  const { state } = useGroupsStore();
  const { joinGroup, leaveGroup, cancelApplication, toggleFollowGroup } = useGroupsActions();
  const { user } = useAuth();
  const { addToast } = useToast();
  const requireAuthAction = useRequireAuthAction();
  const remaining = getRemainingSlots(group);
  const service = getServiceById(group.serviceId ?? group.platform);
  const plan = getPlanById(group.serviceId, group.planId);
  const occupancy = getGroupOccupancy(group);
  const serviceLabel = service?.name ?? service?.shortLabel ?? group.platform ?? "未設定服務";
  const planLabel = plan?.name ?? group.plan ?? "未設定方案";
  const priceLabel = getCardPriceLabel(group, plan);
  const isHosted = Boolean(user) && state.myGroups.hosted.includes(group.id);
  const isJoined = Boolean(user) && state.myGroups.joined.includes(group.id);
  const isPending = Boolean(user) && (state.myGroups.pending ?? []).includes(group.id);
  const isApplied = isJoined || isPending;
  const isFollowed = Boolean(user) && state.myGroups.followed.includes(group.id);
  const isInstantJoin = group.joinPolicy === "instant";
  const canApply = group.status !== "expired" && remaining > 0;
  const usesDetailAction = typeof onClick === "function" && !onJoin;
  const remainingStatusTheme =
    group.status === "expired"
      ? {
          progressFillClassName: "bg-black/25",
          textClassName: "text-black/45",
          subtleTextClassName: "text-black/55",
        }
      : getRemainingSeatStatusTheme(occupancy.remainingSeats);

  async function toggleFollow(event) {
    event.stopPropagation();
    try {
      await requireAuthAction("請先登入後再追蹤群組。", async () => {
        await toggleFollowGroup(group.id);
        addToast(isFollowed ? "已取消追蹤" : "已加入追蹤");
      });
    } catch (error) {
      addToast(error.message || "追蹤狀態更新失敗，請稍後再試");
    }
  }

  return (
    <Card
      className={[
        "relative z-0 w-full overflow-hidden border p-0 text-black transition-all duration-200 hover:z-10 hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(15,23,42,0.10)]",
        onClick ? "cursor-pointer focus-within:ring-2 focus-within:ring-black/10" : "",
        className,
      ].join(" ")}
      onClick={onClick}
    >
      <button
        type="button"
        onClick={toggleFollow}
        className="absolute top-4 right-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-white/96 text-black/58 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm transition hover:text-black"
        aria-label={isFollowed ? "取消收藏群組" : "收藏群組"}
      >
        {isFollowed ? (
          <HeartSolidIcon className="h-4 w-4 text-rose-500" />
        ) : (
          <HeartIcon className="h-4 w-4" />
        )}
      </button>

      <div className="space-y-5 p-5">
        <div className="flex items-start gap-4 pr-12">
          <PlatformAvatar
            platform={group.platform}
            serviceId={group.serviceId}
            iconKey={group.iconKey}
          />

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="truncate text-lg font-extrabold tracking-tight text-black">
              {serviceLabel}
            </div>
            <div className="mt-1 text-sm text-black/58">{planLabel}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-black/58">
            團主 <span className="font-semibold text-black">{group.hostName}</span>
          </div>

          <div className="text-sm text-black/58">
            <span>剩餘名額：</span>
            <span className={["font-semibold", remainingStatusTheme.textClassName].join(" ")}>
              {occupancy.remainingSeats}
            </span>
          </div>

          <ProgressBar
            value={occupancy.progress}
            className="bg-black/8"
            fillClassName={remainingStatusTheme.progressFillClassName}
          />
        </div>

        <div className="border-t border-black/8 pt-4 text-center">
          <span className="font-display text-base font-semibold tracking-tight text-black">
            {priceLabel}
          </span>
        </div>

        <div className="flex justify-center border-t border-black/8 pt-4">
          <Button
            variant={
              usesDetailAction
                ? actionVariant ?? "outline"
                : isJoined || isPending
                  ? "outline"
                  : "primary"
            }
            disabled={usesDetailAction ? false : isHosted || (!isApplied && !canApply)}
            onClick={async (event) => {
              event.stopPropagation();
              if (usesDetailAction) {
                onClick?.();
                return;
              }
              if (isHosted) return;
              try {
                if (isJoined) {
                  await requireAuthAction("請先登入後再管理你的群組。", async () => {
                    await leaveGroup(group.id);
                    addToast("已退出群組");
                  });
                  return;
                }
                if (isPending) {
                  await requireAuthAction("請先登入後再管理你的群組申請。", async () => {
                    await cancelApplication(group.id, user.uid);
                    addToast("已取消申請");
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
                if (isInstantJoin) {
                  await joinGroup(group.id);
                  addToast("已成功加入群組");
                } else {
                  navigate(`/groups/${group.id}/apply`);
                }
              } catch (error) {
                addToast(error.message || "操作失敗，請稍後再試");
              }
            }}
            className={
              [
                usesDetailAction
                  ? "!border-black !bg-black !text-white hover:!bg-black/90 hover:!text-white"
                  : isJoined || isPending
                    ? "border-black/10 bg-black/[0.03] text-black hover:bg-black/[0.06] hover:text-black"
                    : "",
                usesDetailAction ? "min-w-[152px] justify-center" : "",
                !usesDetailAction && (isHosted || (!isApplied && !canApply))
                  ? "opacity-60"
                  : "",
              ].filter(Boolean).join(" ")
            }
          >
            {usesDetailAction
              ? actionLabel ?? "查看詳情"
              : isHosted
                ? "你是團主"
                : isJoined
                  ? "退出群組"
                  : isPending
                    ? "取消申請"
                    : isInstantJoin
                      ? "立即加入"
                      : "申請加入"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
