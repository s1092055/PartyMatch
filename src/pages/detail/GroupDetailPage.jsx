import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../../shared/components/feedback/EmptyState.jsx";
import { LoadingSpinner } from "../../shared/components/feedback/LoadingSpinner.jsx";
import { SmartContainer } from "../../shared/components/layout/SmartContainer.jsx";
import { useAuth } from "../../shared/modules/auth/hooks/useAuth.js";
import { useRequireAuthAction } from "../../shared/modules/auth/hooks/useRequireAuthAction.js";
import { useGroupsActions, useGroupsStore } from "../../shared/modules/groups/state/index.js";
import { GROUPS_MOCK } from "../../data/groups.mock.js";
import {
  getPlanById,
  getServiceById,
} from "../../data/services.config.js";
import { getGroupById } from "../../shared/modules/groups/services/groupService.js";
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
    className: "bg-[#eef3ff] text-[#1d4ed8]",
    panelClassName: "bg-[#eef3ff] text-[#1d4ed8]",
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
    return `這位團主已提供 ${serviceLabel} 方案內容、加入前須知與官方參考資訊，適合偏好先看清規則再決定加入的成員。`;
  }

  if (hasRules) {
    return `這位團主已公開基本團規與加入說明，適合希望先理解共享節奏與分攤方式的成員。`;
  }

  return "目前頁面提供了基本群組資訊，若你在意共享細節，申請前可以再和團主確認付款與加入規則。";
}

export function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useGroupsStore();
  const { joinGroup, leaveGroup, toggleFollowGroup } = useGroupsActions();
  const requireAuthAction = useRequireAuthAction();
  const liveGroup = state.groups.find((item) => item.id === id) ?? null;
  const [fallbackGroup, setFallbackGroup] = useState(null);
  const [loading, setLoading] = useState(!liveGroup);
  const [error, setError] = useState("");
  const [isBottomSummaryExpanded, setIsBottomSummaryExpanded] = useState(false);
  const [bottomSummaryHeight, setBottomSummaryHeight] = useState(0);
  const [isBottomSummaryLayoutActive, setIsBottomSummaryLayoutActive] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth < 1280,
  );
  const bottomSummaryRef = useRef(null);
  const desktopSummaryRailStyle = useMemo(
    () => ({
      width: "332px",
      right: "max(2rem, calc((100vw - 80rem) / 2 + 2rem))",
    }),
    [],
  );

  useEffect(() => {
    let isMounted = true;

    if (liveGroup) {
      setLoading(false);
      setError("");
      return undefined;
    }

    async function loadGroup() {
      setLoading(true);
      setError("");

      try {
        const nextGroup = await getGroupById(id);
        if (!isMounted) return;
        setFallbackGroup(nextGroup);
      } catch (nextError) {
        if (!isMounted) return;
        setError(nextError.message || "讀取群組失敗。");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadGroup();
    return () => {
      isMounted = false;
    };
  }, [id, liveGroup]);

  useEffect(() => {
    setIsBottomSummaryExpanded(false);
  }, [id]);

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

  const group = liveGroup ?? fallbackGroup;
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
  const title = `${serviceLabel} ${planLabel}`;
  const subtitle =
    group?.title && group.title !== title
      ? group.title
      : group?.description || "查看這個共享群組的詳細資訊、團規與申請條件。";
  const statusMeta = useMemo(() => getStatusMeta(group ?? {}, occupancy), [group, occupancy]);
  const priceLabel =
    getPricePerSeatLabel(group?.serviceId, group?.planId) ??
    (group?.pricePerMonth != null
      ? `約 ${group.currency === "USD" ? "US$" : "NT$"}${Math.round(group.pricePerMonth)} / ${group.billingCycle === "yearly" ? "年" : "月"}`
      : "價格待補充");
  const categoryLabel = getCategoryLabel(service);
  const nextPaymentDateLabel = formatPaymentDate(group?.nextPaymentDate);
  const hostName = group?.hostName ?? "匿名團主";
  const isHosted = Boolean(user) && Boolean(group) && state.myGroups.hosted.includes(group.id);
  const isApplied = Boolean(user) && Boolean(group) && state.myGroups.joined.includes(group.id);
  const isFollowed = Boolean(user) && Boolean(group) && state.myGroups.followed.includes(group.id);
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
    features.length > 0 ? "已提供方案功能與共享內容" : null,
    rules.length > 0 ? "已公開加入前須知與團規說明" : null,
    summary?.officialLink ? "可直接查看官方方案資訊" : null,
  ].filter(Boolean);
  const hostSummary = getHostSummaryText(
    serviceLabel,
    rules.length > 0,
    Boolean(summary?.officialLink),
  );
  const primaryActionLabel = isHosted
    ? "你是團主"
    : isApplied
      ? "取消申請"
      : canApply
        ? "申請加入"
        : "暫無名額";
  const primaryActionDisabled = isHosted || (!isApplied && !canApply);
  const followActionLabel = isFollowed ? "已加入追蹤" : "加入追蹤";
  const followActionHoverLabel = isFollowed ? "取消追蹤" : "加入追蹤";
  const featureWidgets = features.map((feature) => ({
    feature,
    Icon: getFeatureIcon(feature),
  }));
  const recommendedGroups = useMemo(() => {
    if (!group) return [];

    const currentCategoryId = service?.category ?? null;
    const sourceGroups = state.groups.length ? state.groups : GROUPS_MOCK;

    return sourceGroups
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
  }, [group, service?.category, state.groups]);

  function handlePrimaryAction() {
    if (isHosted) return;
    if (isApplied) {
      requireAuthAction("請先登入後再管理你的群組申請。", () => {
        leaveGroup(group.id);
      });
      return;
    }
    if (!canApply) return;
    requireAuthAction("請先登入後再申請加入群組。", () => {
      joinGroup(group.id);
    });
  }

  function handleToggleFollow() {
    requireAuthAction("請先登入後再追蹤群組。", () => {
      toggleFollowGroup(group.id);
    });
  }

  if (loading) {
    return <LoadingSpinner label="正在準備群組詳情..." />;
  }

  if (error) {
    return (
      <section className="py-14 sm:py-16">
        <SmartContainer size="reading" className="px-4 sm:px-6 lg:px-8">
          <EmptyState
            title="無法載入群組詳情"
            description={error}
            action={
              <Link
                to="/explore"
                className="inline-flex items-center justify-center rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                返回探索群組
              </Link>
            }
          />
        </SmartContainer>
      </section>
    );
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
                className="inline-flex items-center justify-center rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
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
      className="overflow-x-hidden py-10 pb-40 sm:py-12 sm:pb-44 xl:pb-12"
      style={
        isBottomSummaryLayoutActive && bottomSummaryHeight > 0
          ? { paddingBottom: `${bottomSummaryHeight + 16}px` }
          : undefined
      }
    >
      <SmartContainer size="wide" className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <Link
            to="/explore"
            className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/70 transition hover:bg-black/[0.03] hover:text-black"
          >
            返回探索群組
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span
              className={[
                "inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-[0.14em]",
                statusMeta.className,
              ].join(" ")}
            >
              {statusMeta.label}
            </span>
            <span className="inline-flex rounded-full bg-black/[0.04] px-3 py-1 text-xs font-semibold tracking-[0.14em] text-black/60">
              {categoryLabel}
            </span>
            {(group.tags ?? []).slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-full bg-black/[0.04] px-3 py-1 text-xs font-medium text-black/60"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-black sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-black/62">{subtitle}</p>

          <div className="mt-5 text-sm text-black/58">由 {hostName} 發起</div>
        </div>

        <div className="mt-6 xl:pr-[380px]">
          <div className="min-w-0 space-y-6">
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

            <GroupDetailSection eyebrow="群組簡介" title="這個群組目前在做什麼？">
              <p className="text-base leading-8 text-black/62">
                {group.description ||
                  "這是一個由團主建立的共享群組，目的是讓成員一起分攤訂閱費用並維持穩定續訂。"}
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
              description="先確認團規、付款方式與續訂節奏，再決定是否送出申請。"
            >
              <div className="space-y-4">
                {rules.length ? (
                  rules.map((rule) => (
                    <p key={rule} className="text-sm leading-8 text-black/64">
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

        <aside
          className="pointer-events-none fixed top-24 z-30 hidden xl:block"
          style={desktopSummaryRailStyle}
        >
          <div className="pointer-events-auto pr-1">
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
              primaryActionLabel={primaryActionLabel}
              primaryActionDisabled={primaryActionDisabled}
              onPrimaryAction={handlePrimaryAction}
              onToggleFollow={handleToggleFollow}
              officialLink={summary?.officialLink}
            />
          </div>
        </aside>
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
        followActionLabel={followActionLabel}
        followActionHoverLabel={followActionHoverLabel}
        onToggleFollow={handleToggleFollow}
        isApplied={isApplied}
        primaryActionLabel={primaryActionLabel}
        primaryActionDisabled={primaryActionDisabled}
        onPrimaryAction={handlePrimaryAction}
      />
    </section>
  );
}
