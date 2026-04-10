import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../../shared/components/feedback/EmptyState.jsx";
import { SmartContainer } from "../../shared/components/layout/SmartContainer.jsx";
import { useAuth } from "../../shared/modules/auth/hooks/useAuth.js";
import { useRequireAuthAction } from "../../shared/modules/auth/hooks/useRequireAuthAction.js";
import { useGroupsActions, useGroupsStore } from "../../shared/modules/groups/state/index.js";
import { useToast } from "../../shared/hooks/useToast.js";
import {
  getPlanById,
  getServiceById,
} from "../../data/services.config.js";
import {
  getGroupOccupancy,
  getPlanSummary,
  getPricePerSeatLabel,
} from "../../shared/modules/groups/utils/groupSummary.js";
import {
  getCategoryLabel,
  getFeatureIcon,
  getHeroTheme,
} from "../../shared/utils/serviceTheme.js";
import { GroupDetailFaqSection } from "./components/GroupDetailFaqSection.jsx";
import { GroupDetailFeatureStrip } from "./components/GroupDetailFeatureStrip.jsx";
import { GroupDetailHero } from "./components/GroupDetailHero.jsx";
import { GroupDetailHostSection } from "./components/GroupDetailHostSection.jsx";
import { GroupDetailMobileSummary } from "./components/GroupDetailMobileSummary.jsx";
import { GroupDetailRecommendations } from "./components/GroupDetailRecommendations.jsx";
import { GroupDetailSection } from "./components/GroupDetailSection.jsx";
import { GroupDetailSummaryCard } from "./components/GroupDetailSummaryCard.jsx";

function formatPaymentDate(value) {
  if (!value) return "待補充";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-TW", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getStatusMeta(group, occupancy) {
  if (group.status === "expired") {
    return {
      label: "已截止",
      className: "bg-black/[0.06] text-black/60",
      panelClassName: "bg-black/[0.04] text-black/60",
    };
  }

  if (occupancy.remainingSeats <= 0) {
    return {
      label: "已滿團",
      className: "bg-black/[0.06] text-black/60",
      panelClassName: "bg-black/[0.04] text-black/60",
    };
  }

  if (occupancy.remainingSeats === 1) {
    return {
      label: "即將滿團",
      className: "bg-[#fff4d8] text-[#9a5a00]",
      panelClassName: "bg-[#fff4d8] text-[#9a5a00]",
    };
  }

  return {
    label: "招募中",
    className: "bg-black/[0.06] text-black",
    panelClassName: "bg-black/[0.06] text-black",
  };
}

function buildFaqs(serviceLabel, planLabel) {
  return [
    {
      question: "加入後何時會被拉進共享方案？",
      answer: `通常在付款確認後由團主協助加入 ${serviceLabel} ${planLabel}，若有等待名單會依申請順序處理。`,
    },
    {
      question: "之後如何續費與提醒？",
      answer: "PartyMatch 會顯示下次扣款日與續訂資訊，實際付款方式依團主設定通知。",
    },
    {
      question: "如果中途想退出怎麼辦？",
      answer: "可以先和團主協調退出時間，避免影響當期分攤與其他團員名額安排。",
    },
  ];
}

function getHostSummaryText(serviceLabel, hasRules, hasOfficialLink) {
  if (hasRules && hasOfficialLink) {
    return `此團主已提供 ${serviceLabel} 方案內容、加入前須知與官方參考資訊。`;
  }

  if (hasRules) {
    return "此團主已公開基本團規與加入說明。";
  }

  return "此群組提供基本資訊，如有疑問可先與團主確認。";
}

export function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useGroupsStore();
  const currentUserId = user?.id ?? null;
  const {
    dissolveGroup,
    joinGroup,
    leaveGroup,
    cancelApplication,
    toggleFollowGroup,
  } = useGroupsActions();
  const requireAuthAction = useRequireAuthAction();
  const { addToast } = useToast();
  const group = useMemo(
    () => state.groups.find((g) => g.id === id) ?? null,
    [state.groups, id],
  );
  const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);
  const [isDissolving, setIsDissolving] = useState(false);
  const [isBottomSummaryExpanded, setIsBottomSummaryExpanded] = useState(false);
  const [bottomSummaryHeight, setBottomSummaryHeight] = useState(0);
  const [isBottomSummaryLayoutActive, setIsBottomSummaryLayoutActive] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth < 1280,
  );
  const bottomSummaryRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 1279px)");
    const syncLayout = () => setIsBottomSummaryLayoutActive(mediaQuery.matches);

    syncLayout();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncLayout);
      return () => mediaQuery.removeEventListener("change", syncLayout);
    }

    mediaQuery.addListener(syncLayout);
    return () => mediaQuery.removeListener(syncLayout);
  }, []);

  const service = useMemo(
    () => (group ? getServiceById(group.serviceId ?? group.platform) : null),
    [group],
  );
  const plan = useMemo(
    () => (group ? getPlanById(group.serviceId, group.planId) : null),
    [group],
  );
  const summary = useMemo(
    () => (group ? getPlanSummary(group.serviceId, group.planId) : null),
    [group],
  );

  useLayoutEffect(() => {
    const node = bottomSummaryRef.current;
    if (!node || typeof window === "undefined") return undefined;

    function updateHeight() {
      setBottomSummaryHeight(node.getBoundingClientRect().height);
    }

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }

    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(node);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [id, isBottomSummaryExpanded, summary?.officialLink]);

  const occupancy = useMemo(() => getGroupOccupancy(group), [group]);
  const serviceLabel = service?.name ?? group?.platform ?? "未設定服務";
  const planLabel = plan?.name ?? group?.plan ?? "未設定方案";
  const statusMeta = useMemo(() => getStatusMeta(group ?? {}, occupancy), [group, occupancy]);
  const priceLabel =
    getPricePerSeatLabel(group?.serviceId, group?.planId) ??
    (group?.pricePerMonth != null
      ? `約 ${group.currency === "USD" ? "US$" : "NT$"}${Math.round(group.pricePerMonth)} / ${group.billingCycle === "yearly" ? "年" : "月"}`
      : "價格待補充");
  const categoryLabel = getCategoryLabel(service);
  const nextPaymentDateLabel = formatPaymentDate(group?.nextPaymentDate);
  const hostName = group?.hostName ?? "匿名團主";
  const isHosted = Boolean(group) && Boolean(currentUserId) && group.ownerId === currentUserId;
  const isJoined = Boolean(user) && Boolean(group) && state.myGroups.joined.includes(group.id);
  const isPending = Boolean(user) && Boolean(group) && (state.myGroups.pending ?? []).includes(group.id);
  const isFollowed = Boolean(user) && Boolean(group) && state.myGroups.followed.includes(group.id);
  const isInstantJoin = group?.joinPolicy === "instant";
  const canApply =
    Boolean(group) && group.status !== "expired" && occupancy.remainingSeats > 0;
  const features = summary?.fullFeatures?.length
    ? summary.fullFeatures
    : service?.description
      ? [service.description]
      : [];
  const rules = [
    plan?.shareHint,
    group?.memberRule,
    plan?.notes,
    group?.description,
  ].filter(Boolean);
  const faqItems = buildFaqs(serviceLabel, planLabel);
  const hostSignals = [
    features.length > 0 ? "已提供方案功能" : null,
    rules.length > 0 ? "已公開團規說明" : null,
    summary?.officialLink ? "提供官方方案連結" : null,
  ].filter(Boolean);
  const hostSummary = getHostSummaryText(
    serviceLabel,
    rules.length > 0,
    Boolean(summary?.officialLink),
  );
  const primaryActionLabel = isHosted
    ? "編輯群組"
    : isJoined
      ? "退出群組"
      : isPending
        ? "取消申請"
        : canApply
          ? isInstantJoin ? "立即加入" : "申請加入"
          : "暫無名額";
  const primaryActionDisabled = !isHosted && !isJoined && !isPending && !canApply;
  const secondaryActionLabel = isHosted ? "解散群組" : "";
  const isApplied = isJoined || isPending;
  const followActionLabel = isFollowed ? "已加入追蹤" : "加入追蹤";
  const followActionHoverLabel = isFollowed ? "取消追蹤" : "加入追蹤";
  const featureWidgets = features.map((feature) => ({
    feature,
    Icon: getFeatureIcon(feature),
  }));
  const recommendedGroups = useMemo(() => {
    if (!group) return [];

    const currentCategoryId = service?.category ?? null;

    return state.groups
      .filter((candidate) => candidate.id !== group.id)
      .map((candidate) => {
        const candidateService = getServiceById(candidate.serviceId ?? candidate.platform);
        const candidateCategoryId = candidateService?.category ?? null;
        const candidateOccupancy = getGroupOccupancy(candidate);
        let score = 0;

        if (candidate.serviceId === group.serviceId) score += 5;
        if (candidateCategoryId && candidateCategoryId === currentCategoryId) score += 3;
        if (candidate.planId === group.planId) score += 1;
        if (candidateOccupancy.remainingSeats > 0) score += 1;
        if (candidate.status === "expired") score -= 5;
        if (candidate.tags?.includes("熱門")) score += 0.5;

        return { candidate, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ candidate }) => candidate);
  }, [state.groups, group, service?.category]);

  async function handlePrimaryAction() {
    if (isHosted) {
      navigate("/manage-group/hosted-groups");
      return;
    }

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
      if (isInstantJoin) {
        await requireAuthAction("請先登入後再加入群組。", async () => {
          await joinGroup(group.id);
          addToast("已成功加入群組");
        });
      } else {
        await requireAuthAction("請先登入後再申請加入群組。", () => {
          navigate(`/groups/${group.id}/apply`);
        });
      }
    } catch (error) {
      addToast(error.message || "操作失敗，請稍後再試");
    }
  }

  function handleSecondaryAction() {
    if (!isHosted || !group) return;
    setShowDissolveConfirm(true);
  }

  async function handleConfirmDissolve() {
    setIsDissolving(true);
    try {
      await dissolveGroup(group.id);
      setShowDissolveConfirm(false);
      addToast("群組已解散");
      navigate("/manage-group/hosted-groups");
    } catch (error) {
      addToast(error.message || "解散群組失敗，請稍後再試");
    } finally {
      setIsDissolving(false);
    }
  }

  async function handleToggleFollow() {
    try {
      await requireAuthAction("請先登入後再追蹤群組。", async () => {
        await toggleFollowGroup(group.id);
        addToast(isFollowed ? "已取消追蹤" : "已加入追蹤");
      });
    } catch (error) {
      addToast(error.message || "追蹤狀態更新失敗，請稍後再試");
    }
  }

  if (!group) {
    return (
      <section className="py-14 sm:py-16">
        <SmartContainer size="reading" className="px-4 sm:px-6 lg:px-8">
          <EmptyState
            title="找不到這個群組"
            description="這個群組可能已被移除，或你打開了不存在的連結。"
            action={
              <Link
                to="/explore"
                className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black/80"
              >
                返回探索群組
              </Link>
            }
          />
        </SmartContainer>
      </section>
    );
  }

  return (
    <section
      className="[overflow-x:clip] sm:pt-6 sm:pb-44 xl:pb-12"
      style={
        isBottomSummaryLayoutActive && bottomSummaryHeight > 0
          ? { paddingBottom: `${bottomSummaryHeight + 16}px` }
          : undefined
      }
    >
      <SmartContainer size="wide" className="px-4 sm:px-6 lg:px-8">

        <div className="mt-6 xl:flex xl:gap-8">
          {/* Main content column */}
          <div className="min-w-0 flex-1">
            <div className="space-y-6">
              <GroupDetailHero
                heroTheme={getHeroTheme(group.serviceId)}
                serviceId={group.serviceId}
                platform={group.platform}
                iconKey={group.iconKey}
                serviceLabel={serviceLabel}
                categoryLabel={categoryLabel}
                planLabel={planLabel}
                seatLabel={plan?.seatLabel}
                billingNote={plan?.billingNote}
              />

              <GroupDetailSection eyebrow="群組簡介" title="關於這個群組">
                <p className="text-base leading-8 text-black/62">
                  {group.description ||
                    "此群組由團主建立，成員共同分攤訂閱費用。"}
                </p>
                {service?.description ? (
                  <p className="mt-4 text-sm leading-7 text-black/54">{service.description}</p>
                ) : null}
              </GroupDetailSection>

              <GroupDetailFeatureStrip featureWidgets={featureWidgets} />

              <GroupDetailHostSection
                hostName={hostName}
                serviceLabel={serviceLabel}
                hostSummary={hostSummary}
                hostSignals={hostSignals}
              />

              <GroupDetailSection
                eyebrow="申請須知"
                title="群組備註說明"
                description="申請前請確認以下規則。"
              >
                <div className="space-y-4">
                  {rules.length ? (
                    rules.map((rule, index) => (
                      <p
                        key={`${group?.id ?? "group"}-rule-${index}-${rule}`}
                        className="text-sm leading-8 text-black/64"
                      >
                        {rule}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm leading-8 text-black/64">
                      目前沒有額外團規說明，建議加入前先和團主確認分攤與付款節奏。
                    </p>
                  )}
                </div>
              </GroupDetailSection>

              <GroupDetailFaqSection faqItems={faqItems} />
            </div>

            <GroupDetailRecommendations
              recommendedGroups={recommendedGroups}
              onNavigate={(groupId) => navigate(`/groups/${groupId}`)}
            />
          </div>

          {/* Desktop sticky summary card — stops at the bottom of this column (recommendations) */}
          <aside className="hidden w-[332px] shrink-0 xl:block">
            <div className="sticky top-24">
              <GroupDetailSummaryCard
                statusMeta={statusMeta}
                occupancy={occupancy}
                priceLabel={priceLabel}
                planPriceLabel={plan?.priceLabel}
                planLabel={planLabel}
                serviceLabel={serviceLabel}
                nextPaymentDateLabel={nextPaymentDateLabel}
                isApplied={isApplied}
                isFollowed={isFollowed}
                isOwner={isHosted}
                isInstantJoin={isInstantJoin}
                primaryActionLabel={primaryActionLabel}
                primaryActionDisabled={primaryActionDisabled}
                onPrimaryAction={handlePrimaryAction}
                secondaryActionLabel={secondaryActionLabel}
                onSecondaryAction={handleSecondaryAction}
                onToggleFollow={handleToggleFollow}
                officialLink={summary?.officialLink}
              />
            </div>
          </aside>
        </div>
      </SmartContainer>

      <GroupDetailMobileSummary
        bottomSummaryRef={bottomSummaryRef}
        isExpanded={isBottomSummaryExpanded}
        onToggleExpanded={() => setIsBottomSummaryExpanded((current) => !current)}
        priceLabel={priceLabel}
        planLabel={planLabel}
        occupancy={occupancy}
        planPriceLabel={plan?.priceLabel}
        serviceLabel={serviceLabel}
        nextPaymentDateLabel={nextPaymentDateLabel}
        officialLink={summary?.officialLink}
        isFollowed={isFollowed}
        isOwner={isHosted}
        followActionLabel={followActionLabel}
        followActionHoverLabel={followActionHoverLabel}
        onToggleFollow={handleToggleFollow}
        isApplied={isApplied}
        primaryActionLabel={primaryActionLabel}
        primaryActionDisabled={primaryActionDisabled}
        onPrimaryAction={handlePrimaryAction}
        secondaryActionLabel={secondaryActionLabel}
        onSecondaryAction={handleSecondaryAction}
      />

      {/* ── 解散群組確認 Dialog ── */}
      <DialogPrimitive.Root open={showDissolveConfirm} onOpenChange={(open) => { if (!open) setShowDissolveConfirm(false); }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="fixed left-1/2 top-1/2 z-[200] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)] focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            aria-describedby="dissolve-desc"
          >
            <DialogPrimitive.Title className="text-base font-semibold text-black">
              解散群組
            </DialogPrimitive.Title>
            <p id="dissolve-desc" className="mt-2 text-sm leading-6 text-black/55">
              確定要解散這個群組嗎？此操作無法復原，所有成員將被移除。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDissolveConfirm(false)}
                className="rounded-full border border-black/12 px-4 py-2 text-sm font-medium text-black/60 transition hover:bg-black/5"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDissolve}
                disabled={isDissolving}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isDissolving ? "解散中…" : "確認解散"}
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </section>
  );
}
