import { Link } from "react-router-dom";
import {
  ArrowTopRightOnSquareIcon,
  HeartIcon as HeartSolidIcon,
} from "@heroicons/react/24/solid";
import { HeartIcon } from "@heroicons/react/24/outline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/Tooltip";
import { Button } from "../../../shared/components/ui/Button.jsx";
import { Card } from "../../../shared/components/ui/Card.jsx";
import { ProgressBar } from "../../../shared/components/ui/ProgressBar.jsx";
import { getRemainingSeatStatusTheme } from "../../../shared/modules/groups/utils/groupSummary.js";

export function GroupDetailSummaryCard({
  statusMeta,
  occupancy,
  priceLabel,
  planPriceLabel,
  planLabel,
  serviceLabel,
  nextPaymentDateLabel,
  isApplied,
  isFollowed,
  isOwner,
  isInstantJoin,
  primaryActionLabel,
  primaryActionDisabled,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  onToggleFollow,
  officialLink,
}) {
  const remainingStatusTheme = getRemainingSeatStatusTheme(occupancy.remainingSeats);

  return (
    <aside className="min-w-0">
      <Card className="overflow-hidden rounded-[30px] p-0">
        <div
          className={[
            "flex min-w-0 items-start justify-between gap-3 border-b border-black/8 px-5 py-4 text-sm font-semibold",
            statusMeta.panelClassName,
          ].join(" ")}
        >
          <span className="shrink-0">{statusMeta.label}</span>
          <span className="min-w-0 text-right break-words">
            {occupancy.remainingSeats} 個名額可加入
          </span>
        </div>

        <div className="space-y-4 p-5">
          <div className="min-w-0">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex cursor-default items-center gap-1.5 text-sm font-medium text-black/48">
                    每位分攤
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-black/15 text-[10px] text-black/36">?</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-center text-xs">
                  此為依官方方案等分後的估算金額，實際分攤由群組設定決定
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="font-display mt-2 break-words text-3xl font-semibold tracking-tight text-black">
              {priceLabel}
            </div>
            <div className="mt-2 text-sm text-black/55">
              官方方案 {planPriceLabel ?? "待補充"}
            </div>
          </div>

          <div className="rounded-[22px] bg-black/[0.025] p-4">
            <div className="flex items-center justify-between text-sm text-black/65">
              <span>名額進度</span>
              <span>
                {occupancy.takenSlots}/{occupancy.totalSeats}
              </span>
            </div>
            <ProgressBar
              value={occupancy.progress}
              className="mt-3"
              fillClassName={remainingStatusTheme.progressFillClassName}
            />
            <div className={["mt-3 text-sm", remainingStatusTheme.subtleTextClassName].join(" ")}>
              {occupancy.remainingSeats > 0
                ? `目前還剩 ${occupancy.remainingSeats} 個名額，${isInstantJoin ? "可以立即加入。" : "可以申請加入。"}`
                : "目前沒有空位，可先收藏或稍後再回來查看。"}
            </div>
          </div>

          <div className="space-y-3 text-sm text-black/62">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <span className="shrink-0">方案</span>
              <span className="min-w-0 text-right font-semibold text-black break-words">
                {planLabel}
              </span>
            </div>
            <div className="flex min-w-0 items-start justify-between gap-3">
              <span className="shrink-0">服務</span>
              <span className="min-w-0 text-right font-semibold text-black break-words">
                {serviceLabel}
              </span>
            </div>
            <div className="flex min-w-0 items-start justify-between gap-3">
              <span className="shrink-0">下一次扣款</span>
              <span className="min-w-0 text-right font-semibold text-black break-words">
                {nextPaymentDateLabel}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              className="w-full"
              variant={isOwner ? "outline" : isApplied ? "outline" : "primary"}
              disabled={primaryActionDisabled}
              onClick={onPrimaryAction}
            >
              {primaryActionLabel}
            </Button>
            {!isOwner && !isApplied && !primaryActionDisabled && (
              <p className="text-center text-xs leading-5 text-black/42">
                {isInstantJoin
                  ? "加入後即可使用，無需等待審核"
                  : "送出後等待團主審核，通過即可加入"}
              </p>
            )}

            {isOwner ? (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="inline-flex w-full items-center justify-center rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100"
              >
                {secondaryActionLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggleFollow}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/12 bg-white px-5 py-2.5 text-sm font-semibold text-black/72 transition hover:bg-black/[0.03] hover:text-black"
              >
                {isFollowed ? (
                  <HeartSolidIcon className="h-4 w-4 text-red-500" />
                ) : (
                  <HeartIcon className="h-4 w-4" />
                )}
                {isFollowed ? "已加入追蹤" : "加入追蹤"}
              </button>
            )}
          </div>

          <div className="space-y-3 border-t border-black/8 pt-4">
            {officialLink ? (
              <a
                href={officialLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/12 bg-white px-5 py-2.5 text-sm font-semibold text-black/72 transition hover:bg-black/[0.03] hover:text-black"
              >
                查看官方方案
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>
            ) : null}

            <Link
              to="/explore"
              className="inline-flex w-full items-center justify-center rounded-full border border-black/12 bg-white px-5 py-2.5 text-sm font-semibold text-black/72 transition hover:bg-black/[0.03] hover:text-black"
            >
              返回探索群組
            </Link>
          </div>
        </div>
      </Card>
    </aside>
  );
}
