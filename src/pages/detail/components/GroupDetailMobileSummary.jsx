import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowTopRightOnSquareIcon,
  HeartIcon as HeartSolidIcon,
} from "@heroicons/react/24/solid";
import { ChevronUpIcon, HeartIcon } from "@heroicons/react/24/outline";
import { Button } from "../../../shared/components/ui/Button.jsx";
import { ProgressBar } from "../../../shared/components/ui/ProgressBar.jsx";

const MotionContainer = motion.div;
const MotionContent = motion.div;

export function GroupDetailMobileSummary({
  bottomSummaryRef,
  isExpanded,
  onToggleExpanded,
  priceLabel,
  planLabel,
  occupancy,
  planPriceLabel,
  serviceLabel,
  nextPaymentDateLabel,
  officialLink,
  isFollowed,
  followActionLabel,
  followActionHoverLabel,
  onToggleFollow,
  isApplied,
  primaryActionLabel,
  primaryActionDisabled,
  onPrimaryAction,
}) {
  return (
    <MotionContainer
      ref={bottomSummaryRef}
      layout
      initial={false}
      className="fixed bottom-0 left-0 right-0 z-40 w-full max-w-full overflow-hidden rounded-t-[28px] border-t border-black/10 bg-white/96 shadow-[0_-20px_48px_rgba(15,23,42,0.14)] backdrop-blur-xl xl:hidden"
    >
      <button
        type="button"
        onClick={onToggleExpanded}
        className="group flex w-full items-start justify-between gap-4 px-4 pb-4 pt-3 text-left sm:px-5"
        aria-expanded={isExpanded}
        aria-controls="group-detail-bottom-summary"
        aria-label={isExpanded ? "收合共享摘要" : "展開共享摘要"}
      >
        <div className="min-w-0">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-black/10" />
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/36">
            共享摘要
          </div>
          <div className="mt-2 break-words text-lg font-semibold tracking-tight text-black">
            {priceLabel}
          </div>
          <div className="mt-1 text-sm text-black/54">
            {planLabel} · 尚有 {occupancy.remainingSeats} 個名額
          </div>
        </div>
        <div className="mt-4 shrink-0 rounded-full border border-black/10 bg-white p-2 text-black/55 shadow-sm">
          <ChevronUpIcon
            className={[
              "h-4 w-4 transition-transform duration-200",
              isExpanded ? "rotate-180" : "rotate-0",
            ].join(" ")}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <MotionContent
            id="group-detail-bottom-summary"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-black/8"
          >
            <div className="space-y-5 px-4 pb-3 pt-5 sm:px-5">
              <div className="rounded-[24px] bg-black/[0.025] p-4">
                <div className="flex items-center justify-between text-sm text-black/65">
                  <span>名額進度</span>
                  <span>
                    {occupancy.takenSlots}/{occupancy.totalSeats}
                  </span>
                </div>
                <ProgressBar
                  value={occupancy.progress}
                  className="mt-3"
                  fillClassName="bg-[#2563eb]/70"
                />
                <div className="mt-3 text-sm leading-7 text-black/58">
                  {occupancy.remainingSeats > 0
                    ? `目前還剩 ${occupancy.remainingSeats} 個名額，可以直接申請。`
                    : "目前沒有空位，可先收藏或稍後再回來查看。"}
                </div>
              </div>

              <div className="space-y-3 text-sm text-black/62">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <span className="shrink-0">方案</span>
                  <span className="min-w-0 break-words text-right font-semibold text-black">
                    {planLabel}
                  </span>
                </div>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <span className="shrink-0">服務</span>
                  <span className="min-w-0 break-words text-right font-semibold text-black">
                    {serviceLabel}
                  </span>
                </div>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <span className="shrink-0">下一次扣款</span>
                  <span className="min-w-0 break-words text-right font-semibold text-black">
                    {nextPaymentDateLabel}
                  </span>
                </div>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <span className="shrink-0">官方方案</span>
                  <span className="min-w-0 break-words text-right font-semibold text-black">
                    {planPriceLabel ?? "待補充"}
                  </span>
                </div>
              </div>

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
            </div>
          </MotionContent>
        ) : null}
      </AnimatePresence>

      <div className="border-t border-black/8 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-5 sm:px-5">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onToggleFollow}
            aria-label={isFollowed ? "取消追蹤此群組" : "加入追蹤此群組"}
            className={[
              "group inline-flex min-w-0 items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition",
              isFollowed
                ? "border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100"
                : "border-black/12 bg-white text-black/72 hover:bg-black/[0.03] hover:text-black",
            ].join(" ")}
          >
            {isFollowed ? (
              <HeartSolidIcon className="h-4 w-4 shrink-0 text-red-500" />
            ) : (
              <HeartIcon className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate">
              {isFollowed ? (
                <>
                  <span className="sm:hidden">{followActionLabel}</span>
                  <span className="hidden sm:inline group-hover:hidden">
                    {followActionLabel}
                  </span>
                  <span className="hidden sm:group-hover:inline">
                    {followActionHoverLabel}
                  </span>
                </>
              ) : (
                followActionLabel
              )}
            </span>
          </button>

          <Button
            type="button"
            className="w-full min-w-0"
            variant={isApplied ? "outline" : "primary"}
            disabled={primaryActionDisabled}
            onClick={onPrimaryAction}
          >
            <span className="truncate">{primaryActionLabel}</span>
          </Button>
        </div>
      </div>
    </MotionContainer>
  );
}
