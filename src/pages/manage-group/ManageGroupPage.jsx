import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const MotionDiv = motion.div;
import { Link } from "react-router-dom";
import {
  ClockIcon,
  HeartIcon,
  InboxStackIcon,
  RectangleGroupIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../shared/modules/auth/hooks/useAuth.js";
import { useOwnedGroups } from "../../shared/modules/groups/hooks/useOwnedGroups.js";
import { EmptyState } from "../../shared/components/feedback/EmptyState.jsx";
import {
  selectApplicationsByHost,
  selectFollowedGroups,
  selectMyGroups,
  selectMyPendingGroups,
  useGroupsStore,
} from "../../shared/modules/groups/state/index.js";
import { useGroupsActions } from "../../shared/modules/groups/state/groupsHooks.js";
import { GroupTable } from "./components/GroupTable.jsx";
import { ApplicationReviewPanel } from "./components/ApplicationReviewPanel.jsx";
import { HostedGroupsModalContent } from "./components/HostedGroupsModalContent.jsx";
import { GroupCard } from "../../shared/modules/groups/components/GroupCard.jsx";
import { SectionPanel } from "../../shared/components/layout/SectionPanel.jsx";
import { ServiceIcon } from "../../shared/components/ui/ServiceIcon.jsx";
import { Badge } from "../../shared/components/ui/Badge.jsx";
import { Button } from "../../shared/components/ui/Button.jsx";
import { getServiceById, getPlanById } from "../../data/services.config.js";
import { useToast } from "../../shared/hooks/useToast.js";
import { useModalOpen } from "../../shared/hooks/useModalOpen.js";
import {
  DASHBOARD_MODES,
  getDashboardModeStorageKey,
  readStoredDashboardMode,
} from "./dashboardNavigation.config.js";

/* ─── Utility: outside-click hook ─── */
function useOutsideClick(ref, handler) {
  useEffect(() => {
    const fn = (e) => {
      if (document.body.hasAttribute("data-modal-count")) return;
      if (ref.current && !ref.current.contains(e.target)) handler();
    };
    document.addEventListener("pointerdown", fn);
    return () => document.removeEventListener("pointerdown", fn);
  }, [ref, handler]);
}

/* ─── Mode Switcher ─── */
function ModeSwitcher({ mode, onChange }) {
  return (
    <div className="flex rounded-full bg-black/[0.05] p-1">
      {[
        { id: DASHBOARD_MODES.EXPLORER, label: "探索者" },
        { id: DASHBOARD_MODES.HOST, label: "團主" },
      ].map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className="relative min-w-[76px] rounded-full px-4 py-2 text-sm font-semibold"
        >
          {mode === m.id && (
            <MotionDiv
              layoutId="mode-switcher-pill"
              className="absolute inset-0 rounded-full bg-white shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          <span
            className={[
              "relative z-10 transition-colors duration-200",
              mode === m.id ? "text-black" : "text-black/45",
            ].join(" ")}
          >
            {m.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ─── Bento Card ─── */
function BentoCard({ card, mode, onClick }) {
  return (
    <MotionDiv
      layoutId={`bento-card-${mode}-${card.id}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`展開 ${card.label}`}
      className={[
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl",
        "border border-black/[0.07] bg-white p-6",
        "transition-shadow duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)]",
        card.colSpan === 3 ? "sm:col-span-2 lg:col-span-3" : "",
        card.colSpan === 2 ? "lg:col-span-2" : "",
      ].join(" ")}
      whileHover={{ y: -2, transition: { type: "spring", stiffness: 350, damping: 28 } }}
    >
      {/* Icon — no background, just the glyph */}
      <card.Icon className="h-5 w-5 text-black/40" />

      {/* Label + description — PRIMARY */}
      <div className="mt-3">
        <div className="text-[15px] font-semibold tracking-tight text-black">{card.label}</div>
        <div className="mt-1 text-sm leading-relaxed text-black/42">{card.description}</div>
      </div>

      {/* Count — secondary, uses display font for refinement */}
      <div className="mt-4 flex items-end gap-1.5">
        <span className="font-display text-3xl font-bold tracking-tight text-black">{card.count}</span>
        <span className="mb-0.5 text-xs text-black/38">{card.countLabel}</span>
      </div>

      {/* Service icon preview strip */}
      {card.previewGroups?.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          {card.previewGroups.slice(0, 8).map((group) => (
            <div
              key={group.id}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-black/8 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <ServiceIcon
                serviceId={group.serviceId}
                platform={group.platform}
                iconKey={group.iconKey}
                className="h-4 w-4 object-contain"
              />
            </div>
          ))}
          {card.previewGroups.length > 8 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black/8 bg-white text-xs font-semibold text-black/38">
              +{card.previewGroups.length - 8}
            </div>
          )}
        </div>
      )}

      {/* Pending badge for host review card */}
      {card.badge != null && card.badge > 0 && (
        <div className="mt-4">
          <Badge tone="red">{card.badge} 筆待審核</Badge>
        </div>
      )}

      {/* Expand hint */}
      <div className="mt-auto flex items-center justify-end pt-5">
        <span className="text-xs font-medium text-black/20 transition-colors duration-200 group-hover:text-black/45">
          點擊展開 →
        </span>
      </div>
    </MotionDiv>
  );
}

/* ─── Shared time formatter (module scope to avoid purity lint) ─── */
function formatTimeAgo(iso) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "剛剛";
  if (m < 60) return `${m} 分鐘前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小時前`;
  return `${Math.floor(h / 24)} 天前`;
}

/* ─── Modal content: my applications (explorer) ─── */
function PendingAppsContent({ userId, state }) {
  const { cancelApplication } = useGroupsActions();
  const { addToast } = useToast();
  const pendingGroups = selectMyPendingGroups(state);
  const myApps = (state.applications ?? []).filter((app) => app.userId === userId);
  const pendingApps = myApps.filter((a) => a.status === "pending");
  const resolvedApps = myApps.filter((a) => a.status === "approved" || a.status === "rejected");

  const STATUS_BADGE = {
    approved: { label: "已通過", tone: "green" },
    rejected: { label: "已拒絕", tone: "red" },
  };

  if (!pendingGroups.length && !resolvedApps.length) {
    return (
      <EmptyState
        title="目前沒有申請紀錄"
        description="前往探索群組頁，申請感興趣的共享方案。"
        action={
          <Link
            to="/explore"
            className="inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black/80"
          >
            前往探索群組
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {pendingGroups.length > 0 && (
        <SectionPanel title="申請中的群組" description="等待團主審核中。">
          <div className="overflow-hidden rounded-[20px] border border-black/8">
            <div className="divide-y divide-black/8">
              {pendingGroups.map((group) => {
                const service = getServiceById(group.serviceId ?? group.platform);
                const plan = getPlanById(group.serviceId, group.planId);
                const app = pendingApps.find((a) => a.groupId === group.id);
                if (!app) return null;
                return (
                  <div key={group.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/8 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                        <ServiceIcon serviceId={group.serviceId} platform={group.platform} iconKey={group.iconKey} className="h-5 w-5 object-contain" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-black">{service?.shortLabel ?? group.platform}</div>
                        <div className="mt-0.5 text-xs text-black/50">{plan?.name ?? group.plan} · {formatTimeAgo(app.createdAt)}</div>
                        <div className="mt-2"><Badge tone="yellow">審核中</Badge></div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link to={`/groups/${group.id}`} className="inline-flex rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-black/5">
                        查看詳情
                      </Link>
                      <Button
                        variant="outline"
                        className="px-3 py-1.5 text-xs"
                        onClick={async () => {
                          try {
                            await cancelApplication(group.id, userId);
                            addToast("已取消申請");
                          } catch (error) {
                            addToast(error.message || "取消申請失敗");
                          }
                        }}
                      >
                        取消申請
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionPanel>
      )}

      {resolvedApps.length > 0 && (
        <SectionPanel title="申請結果" description="已審核的申請紀錄。">
          <div className="overflow-hidden rounded-[20px] border border-black/8">
            <div className="divide-y divide-black/8">
              {resolvedApps.map((app) => {
                const group = state.groups.find((g) => g.id === app.groupId);
                if (!group) return null;
                const service = getServiceById(group.serviceId ?? group.platform);
                const plan = getPlanById(group.serviceId, group.planId);
                const statusCfg = STATUS_BADGE[app.status];
                return (
                  <div key={app.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/8 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                        <ServiceIcon serviceId={group.serviceId} platform={group.platform} iconKey={group.iconKey} className="h-5 w-5 object-contain" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-black">{service?.shortLabel ?? group.platform}</div>
                        <div className="mt-0.5 text-xs text-black/50">{plan?.name ?? group.plan}</div>
                        {statusCfg && <div className="mt-2"><Badge tone={statusCfg.tone}>{statusCfg.label}</Badge></div>}
                      </div>
                    </div>
                    <Link to={`/groups/${group.id}`} className="inline-flex shrink-0 rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-black/5">
                      查看詳情
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionPanel>
      )}
    </div>
  );
}

/* ─── Modal content: followed groups ─── */
function FavoritesContent({ groups }) {
  if (!groups.length) {
    return (
      <EmptyState
        title="目前沒有追蹤的群組"
        description="到探索頁收藏感興趣的群組，就會顯示在這裡。"
        action={
          <Link
            to="/explore"
            className="inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black/80"
          >
            前往探索群組
          </Link>
        }
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {groups.map((group) => <GroupCard key={group.id} group={group} />)}
    </div>
  );
}

/* ─── Modal content: host pending review ─── */
function HostReviewContent({ hostedGroupIds, count }) {
  if (count === 0) {
    return (
      <EmptyState
        title="目前沒有待審核申請"
        description="所有申請已處理完畢，目前一切正常。"
      />
    );
  }
  return <ApplicationReviewPanel hostedGroupIds={hostedGroupIds} />;
}

/* ─── Expandable Modal (Aceternity-style layoutId animation) ─── */
function ExpandedModal({ cardId, card, modalContent, mode, onClose }) {
  useModalOpen();
  const modalRef = useRef(null);
  useOutsideClick(modalRef, onClose);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <MotionDiv
        className="fixed inset-0 z-40 bg-black/32 backdrop-blur-[6px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.14 }}
      />

      {/* Expanded card modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <MotionDiv
          ref={modalRef}
          layoutId={`bento-card-${mode}-${cardId}`}
          className="relative flex h-[min(84vh,820px)] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] border border-black/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,247,243,0.98))] shadow-[0_34px_90px_rgba(15,23,42,0.18)]"
          initial={{ opacity: 0, scale: 0.985, y: -12, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.992, y: -8, filter: "blur(8px)" }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-b-[36px] bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.06),transparent_72%)]" />

          <div className="relative flex min-h-0 flex-1 flex-col">
          {/* Modal header */}
          <div className="flex shrink-0 items-center justify-between border-b border-black/6 px-5 py-5 sm:px-6 sm:pt-6">
            <div className="flex items-center gap-3">
              <card.Icon className="h-5 w-5 shrink-0 text-black/40" />
              <div>
                <div className="text-lg font-semibold tracking-tight text-black">{card.label}</div>
                <div className="mt-1 text-sm text-black/48">{card.description}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-black/45 transition hover:bg-black/[0.04] hover:text-black"
              aria-label="關閉"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <MotionDiv
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.2 }}
            >
              {modalContent}
            </MotionDiv>
          </div>
          </div>
        </MotionDiv>
      </div>
    </>
  );
}

/* ─── Main exported page component ─── */
export function ManageGroupPage() {
  const { user } = useAuth();
  const { state } = useGroupsStore();
  const ownerId = user?.id ?? null;
  const { ownedGroups: hostedGroups } = useOwnedGroups(ownerId);
  const dashboardModeStorageKey = getDashboardModeStorageKey(ownerId);

  const [activeModeState, setActiveModeState] = useState(() => ({
    storageKey: dashboardModeStorageKey,
    value: readStoredDashboardMode(dashboardModeStorageKey),
  }));
  const [activeCardId, setActiveCardId] = useState(null);
  const activeMode =
    activeModeState.storageKey === dashboardModeStorageKey
      ? activeModeState.value
      : readStoredDashboardMode(dashboardModeStorageKey);

  const allMyGroups = selectMyGroups(state);
  const joinedGroups = allMyGroups.filter((g) => g.role === "member");
  const followedGroups = selectFollowedGroups(state);
  const pendingGroups = selectMyPendingGroups(state);
  const hostedGroupIds = useMemo(() => hostedGroups.map((g) => g.id), [hostedGroups]);
  const pendingAppsForHost = selectApplicationsByHost(state, hostedGroupIds);

  const displayName = user?.displayName || user?.email?.split("@")[0] || null;

  function handleModeChange(nextMode) {
    setActiveCardId(null);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(dashboardModeStorageKey, nextMode);
    }
    setActiveModeState({
      storageKey: dashboardModeStorageKey,
      value: nextMode,
    });
  }

  const handleClose = useCallback(() => setActiveCardId(null), []);

  /* ── Card definitions for each mode ── */
  const explorerCards = useMemo(() => [
    {
      id: "joined",
      label: "我加入的群組",
      description: "目前參與中的共享訂閱群組",
      Icon: UsersIcon,
      count: joinedGroups.length,
      countLabel: "個群組",
      colSpan: 2,
      previewGroups: joinedGroups,
    },
    {
      id: "pending",
      label: "我的申請",
      description: "等待審核中的群組申請",
      Icon: ClockIcon,
      count: pendingGroups.length,
      countLabel: "筆申請",
      colSpan: 1,
      previewGroups: pendingGroups,
    },
    {
      id: "favorites",
      label: "追蹤群組",
      description: "收藏並持續關注的群組",
      Icon: HeartIcon,
      count: followedGroups.length,
      countLabel: "個追蹤",
      colSpan: 3,
      previewGroups: followedGroups,
    },
  ], [joinedGroups, pendingGroups, followedGroups]);

  const hostCards = useMemo(() => [
    {
      id: "hosted",
      label: "已建立群組管理",
      description: "管理你建立的群組與招募狀態",
      Icon: RectangleGroupIcon,
      count: hostedGroups.length,
      countLabel: "個群組",
      colSpan: 2,
      previewGroups: hostedGroups,
    },
    {
      id: "review",
      label: "待審核申請",
      description: "等待你審核的成員入群申請",
      Icon: InboxStackIcon,
      count: pendingAppsForHost.length,
      countLabel: "筆待審核",
      colSpan: 1,
      previewGroups: pendingAppsForHost
        .map((app) => state.groups.find((g) => g.id === app.groupId))
        .filter(Boolean),
      badge: pendingAppsForHost.length,
    },
  ], [hostedGroups, pendingAppsForHost, state.groups]);

  const cards = activeMode === DASHBOARD_MODES.HOST ? hostCards : explorerCards;
  const activeCard = cards.find((c) => c.id === activeCardId) ?? null;

  function getModalContent(cardId) {
    if (activeMode === DASHBOARD_MODES.EXPLORER) {
      if (cardId === "joined") {
        return (
          <GroupTable
            rows={joinedGroups}
            title="我加入的群組"
            description="目前參與中的共享訂閱群組。"
            emptyMessage="你目前沒有加入任何群組，可先前往探索群組尋找新的共享方案。"
          />
        );
      }
      if (cardId === "pending") return <PendingAppsContent userId={ownerId} state={state} />;
      if (cardId === "favorites") return <FavoritesContent groups={followedGroups} />;
    }
    if (activeMode === DASHBOARD_MODES.HOST) {
      if (cardId === "hosted") {
        return <HostedGroupsModalContent rows={hostedGroups} />;
      }
      if (cardId === "review") {
        return <HostReviewContent hostedGroupIds={hostedGroupIds} count={pendingAppsForHost.length} />;
      }
    }
    return null;
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#faf9f7]">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Page header ── */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/36">群組管理</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.01em] text-[#111110] sm:text-4xl">
              {displayName ? `嗨，${displayName}` : "群組管理中心"}
            </h1>
          </div>
          <ModeSwitcher mode={activeMode} onChange={handleModeChange} />
        </div>

        {/* ── Section label + divider ── */}
        <div className="mb-6 flex items-center gap-3">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-black/38">
            {activeMode === DASHBOARD_MODES.HOST ? "團主管理" : "我的訂閱"}
          </span>
          <div className="h-px flex-1 bg-black/8" />
          {activeMode === DASHBOARD_MODES.HOST ? (
            <Link to="/create-group" className="shrink-0 text-xs font-medium text-black/38 transition hover:text-black/65">
              + 建立新群組
            </Link>
          ) : (
            <Link to="/explore" className="shrink-0 text-xs font-medium text-black/38 transition hover:text-black/65">
              前往探索 →
            </Link>
          )}
        </div>

        {/* ── Bento Grid ── */}
        <AnimatePresence mode="wait">
          <MotionDiv
            key={activeMode}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {cards.map((card) => (
              <BentoCard
                key={card.id}
                card={card}
                mode={activeMode}
                onClick={() => setActiveCardId(card.id)}
              />
            ))}
          </MotionDiv>
        </AnimatePresence>
      </div>

      {/* ── Expandable Modal ── */}
      <AnimatePresence>
        {activeCard && (
          <ExpandedModal
            key={`${activeMode}-${activeCardId}`}
            cardId={activeCardId}
            card={activeCard}
            modalContent={getModalContent(activeCardId)}
            mode={activeMode}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
