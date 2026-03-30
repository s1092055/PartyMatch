import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DASHBOARD_DEFAULT_PATHS,
  DASHBOARD_MODES,
  DASHBOARD_MODE_STORAGE_KEY,
  getDashboardModeMenu,
  getDashboardPathMode,
  isPathAllowedForMode,
} from "../../../pages/main/manage-group/dashboardNavigation.config.js";
import { PageContainer } from "./PageContainer.jsx";
import { Sidebar } from "./Sidebar.jsx";

const MotionAside = motion.aside;
const MotionButton = motion.button;
const MotionDiv = motion.div;

export function DashboardShell({ children, rightRail, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboardPath = location.pathname.startsWith("/manage-group");
  const currentPathMode = getDashboardPathMode(location.pathname);
  const isDashboardRoot = location.pathname === "/manage-group";
  const [activeMode, setActiveMode] = useState(() => {
    if (currentPathMode === DASHBOARD_MODES.HOST) return DASHBOARD_MODES.HOST;
    if (!isDashboardRoot && currentPathMode === DASHBOARD_MODES.EXPLORER) {
      return DASHBOARD_MODES.EXPLORER;
    }
    if (typeof window === "undefined") return DASHBOARD_MODES.EXPLORER;
    const storedMode = window.localStorage.getItem(DASHBOARD_MODE_STORAGE_KEY);
    return storedMode === DASHBOARD_MODES.HOST
      ? DASHBOARD_MODES.HOST
      : DASHBOARD_MODES.EXPLORER;
  });
  const [isDesktopSidebarHovered, setIsDesktopSidebarHovered] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_MODE_STORAGE_KEY, activeMode);
  }, [activeMode]);

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
    setActiveMode(nextMode);
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#f7f8fb]">
      <PageContainer>
        <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="mb-2 lg:hidden">
            <div className="flex items-center gap-3 rounded-[28px] border border-black/8 bg-white/92 p-3 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-md">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/8 bg-white text-black/75 transition hover:bg-black/[0.03] hover:text-black"
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
              <main className="min-w-0 rounded-[32px] border border-black/8 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6 lg:p-8">
                {children}
              </main>

              {rightRail ? (
                <section className="rounded-[28px] border border-black/8 bg-white/88 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
                  {rightRail}
                </section>
              ) : null}
            </div>
          </div>
        </div>
      </PageContainer>

      <AnimatePresence>
        {isMobileSidebarOpen ? (
          <>
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
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
