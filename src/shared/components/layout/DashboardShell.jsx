import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DASHBOARD_DEFAULT_PATHS,
  DASHBOARD_MODES,
  getDashboardModeMenu,
  getDashboardPathMode,
  getDashboardModeStorageKey,
  isPathAllowedForMode,
  readStoredDashboardMode,
} from "../../../pages/manage-group/dashboardNavigation.config.js";
import { useAuth } from "../../modules/auth/hooks/useAuth.js";
import { useOwnedGroups } from "../../modules/groups/hooks/useOwnedGroups.js";
import { useModalOpen } from "../../hooks/useModalOpen.js";
import { useGroupsStore } from "../../modules/groups/state/index.js";
import { PageContainer } from "./PageContainer.jsx";
import { Sidebar } from "./Sidebar.jsx";

const MotionAside = motion.aside;
const MotionButton = motion.button;
const MotionDiv = motion.div;

function MobileSidebarModal({ children }) {
  useModalOpen();
  return children;
}

export function DashboardShell({ children, rightRail, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useGroupsStore();
  const ownerId = user?.id ?? null;
  const { ownedGroups: hostedGroups } = useOwnedGroups(ownerId);
  const dashboardModeStorageKey = getDashboardModeStorageKey(ownerId);
  const isDashboardPath = location.pathname.startsWith("/manage-group");
  const currentPathMode = getDashboardPathMode(location.pathname);
  const isDashboardRoot = location.pathname === "/manage-group";
  const [activeModeState, setActiveModeState] = useState(() => ({
    storageKey: dashboardModeStorageKey,
    value: readStoredDashboardMode(dashboardModeStorageKey),
  }));
  const [isDesktopSidebarHovered, setIsDesktopSidebarHovered] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const activeMode =
    activeModeState.storageKey === dashboardModeStorageKey
      ? activeModeState.value
      : readStoredDashboardMode(dashboardModeStorageKey);

  const resolvedMode =
    currentPathMode === DASHBOARD_MODES.HOST
      ? DASHBOARD_MODES.HOST
      : !isDashboardRoot && currentPathMode === DASHBOARD_MODES.EXPLORER
        ? DASHBOARD_MODES.EXPLORER
        : activeMode;

  const menu = useMemo(() => getDashboardModeMenu(resolvedMode), [resolvedMode]);
  const currentNavItem = useMemo(
    () =>
      [...menu.primary, ...menu.common, ...menu.actions].find(
        (item) => item.to === location.pathname,
      ) ?? null,
    [location.pathname, menu],
  );

  const resolvedSectionTitle =
    title ??
    currentNavItem?.label ??
    (resolvedMode === DASHBOARD_MODES.HOST ? "我建立的群組" : "我加入的群組");
  const resolvedModeLabel =
    resolvedMode === DASHBOARD_MODES.HOST ? "團主" : "探索者";

  const joinedCount = state.myGroups.joined.length;
  const hostedCount = hostedGroups.length;
  const followedCount = state.myGroups.followed.length;
  const pendingCount = (state.myGroups.pending ?? []).length;

  const displayName = user?.displayName || user?.email?.split("@")[0] || null;

  useEffect(() => {
    if (!isDashboardPath) return;
    if (isPathAllowedForMode(location.pathname, resolvedMode)) return;
    navigate(DASHBOARD_DEFAULT_PATHS[resolvedMode], { replace: true });
  }, [isDashboardPath, location.pathname, navigate, resolvedMode]);

  useEffect(() => {
    if (!isMobileSidebarOpen || typeof window === "undefined") return undefined;

    const frameId = window.requestAnimationFrame(() => {
      setIsMobileSidebarOpen(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isMobileSidebarOpen, location.pathname]);

  function handleModeChange(nextMode) {
    const nextPath = DASHBOARD_DEFAULT_PATHS[nextMode];
    if (typeof window !== "undefined") {
      window.localStorage.setItem(dashboardModeStorageKey, nextMode);
    }
    setActiveModeState({
      storageKey: dashboardModeStorageKey,
      value: nextMode,
    });
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#f7f8fb]">
      <PageContainer>
        <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">

          {/* Mobile header */}
          <div className="mb-2 lg:hidden">
            <div className="flex items-center gap-3 border-b border-black/8 px-1 pb-3">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-black/65 transition hover:bg-black/[0.04] hover:text-black"
                aria-label="開啟群組管理導航"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1 text-sm font-medium text-black/58">
                {resolvedModeLabel}
              </div>

              <div className="inline-flex shrink-0 rounded-full bg-black/[0.04] px-3 py-1.5 text-xs font-semibold text-black/60">
                {resolvedSectionTitle}
              </div>
            </div>
          </div>

          {/* Welcome header — desktop only */}
          <div className="mb-8 hidden items-end justify-between border-b border-black/8 pb-8 lg:flex">
            <div>
              <p className="text-sm font-medium text-black/42">
                {resolvedModeLabel}模式 · 群組管理
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-black">
                {displayName ? `歡迎回來，${displayName}` : "群組管理中心"}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {[
                { value: joinedCount, label: "已加入群組" },
                { value: hostedCount, label: "主辦群組" },
                { value: followedCount, label: "追蹤清單" },
                ...(pendingCount > 0 ? [{ value: pendingCount, label: "申請中" }] : []),
              ].map(({ value, label }, i, arr) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="min-w-[64px] text-right">
                    <div className="text-3xl font-bold tracking-tight text-black">{value}</div>
                    <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/38">
                      {label}
                    </div>
                  </div>
                  {i < arr.length - 1 ? (
                    <div className="mx-2 h-8 w-px bg-black/10" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar + Content */}
          <div className="flex items-start gap-4 lg:gap-6">
            <MotionAside
              initial={false}
              animate={{ width: isDesktopSidebarHovered ? 292 : 96 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="sticky top-24 hidden shrink-0 lg:block"
              onMouseEnter={() => setIsDesktopSidebarHovered(true)}
              onMouseLeave={() => setIsDesktopSidebarHovered(false)}
            >
              <Sidebar
                mode={resolvedMode}
                expanded={isDesktopSidebarHovered}
                onModeChange={handleModeChange}
              />
            </MotionAside>

            <div className="min-w-0 flex-1">
              <main className="min-w-0 px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
                {children}
              </main>

              {rightRail ? (
                <section className="p-5">
                  {rightRail}
                </section>
              ) : null}
            </div>
          </div>
        </div>
      </PageContainer>

      <AnimatePresence>
        {isMobileSidebarOpen ? (
          <MobileSidebarModal>
            <MotionButton
              type="button"
              aria-label="關閉群組管理導航"
              className="fixed inset-0 z-40 bg-black/28"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
            />

            <MotionDiv
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 w-[88vw] max-w-sm p-3 sm:p-4"
            >
              <Sidebar
                mode={resolvedMode}
                expanded
                mobile
                onClose={() => setIsMobileSidebarOpen(false)}
                onNavigate={() => setIsMobileSidebarOpen(false)}
                onModeChange={(nextMode) => {
                  handleModeChange(nextMode);
                  setIsMobileSidebarOpen(false);
                }}
              />
            </MotionDiv>
          </MobileSidebarModal>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
