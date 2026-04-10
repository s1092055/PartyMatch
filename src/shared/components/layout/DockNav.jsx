import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import {
  GlobeAltIcon,
  HomeIcon,
  PlusCircleIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import { Dock, DockIcon } from "../ui/Dock.jsx";

const MotionDiv = motion.div;

const dockItems = [
  {
    key: "home",
    to: "/",
    label: "首頁",
    icon: HomeIcon,
  },
  {
    key: "explore",
    to: "/explore",
    label: "探索群組",
    icon: GlobeAltIcon,
  },
  {
    key: "manage-group",
    to: "/manage-group",
    label: "群組管理",
    icon: RectangleStackIcon,
  },
  {
    key: "create-group",
    to: "/create-group",
    label: "建立群組",
    icon: PlusCircleIcon,
  },
];

const DOCK_SCROLL_IGNORE_DELTA = 4;

function isDockItemActive(pathname, key) {
  if (key === "home") return pathname === "/";
  if (key === "explore") {
    return pathname.startsWith("/explore") || pathname.startsWith("/groups/");
  }
  if (key === "manage-group") {
    return pathname.startsWith("/manage-group") || pathname.startsWith("/dashboard");
  }
  if (key === "create-group") return pathname.startsWith("/create-group");
  return false;
}

export function DockNav() {
  const location = useLocation();
  const isGroupDetailPage = location.pathname.startsWith("/groups/");
  const [isDockVisible, setIsDockVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const lastScrollYRef = useRef(0);
  const dockVisibleRef = useRef(true);
  const shouldShowDock = isDockVisible && !isModalOpen && !isFooterVisible;

  const getDockSurfaceClasses = (isActive) =>
    [
      isActive
        ? "border-black/18 bg-black text-white shadow-[0_14px_28px_rgba(0,0,0,0.28)]"
        : "border-transparent bg-white/68 text-black/58 hover:bg-white/90 hover:text-black",
    ].join(" ");

  useEffect(() => {
    dockVisibleRef.current = isDockVisible;
  }, [isDockVisible]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsModalOpen(document.body.hasAttribute("data-modal-count"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-modal-count"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const footer = document.querySelector("[data-app-footer]");
    if (!footer) {
      return undefined;
    }

    if (typeof IntersectionObserver !== "function") {
      const syncFooterVisibility = () => {
        const rect = footer.getBoundingClientRect();
        setIsFooterVisible(
          rect.top <= window.innerHeight - 112 && rect.bottom > 0,
        );
      };

      syncFooterVisibility();
      window.addEventListener("scroll", syncFooterVisibility, { passive: true });
      window.addEventListener("resize", syncFooterVisibility);

      return () => {
        window.removeEventListener("scroll", syncFooterVisibility);
        window.removeEventListener("resize", syncFooterVisibility);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "0px 0px -112px 0px",
      },
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    lastScrollYRef.current = window.scrollY;
    dockVisibleRef.current = true;
    const frameId = window.requestAnimationFrame(() => {
      setIsDockVisible(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;

      if (Math.abs(delta) < DOCK_SCROLL_IGNORE_DELTA) return;

      if (delta > 0) {
        if (dockVisibleRef.current) {
          dockVisibleRef.current = false;
          setIsDockVisible(false);
        }
      } else {
        if (!dockVisibleRef.current) {
          dockVisibleRef.current = true;
          setIsDockVisible(true);
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <MotionDiv
        initial={false}
        animate={
          shouldShowDock
            ? { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }
            : { y: 28, opacity: 0, scale: 0.985, filter: "blur(6px)" }
        }
        transition={{
          duration: 0.34,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={[
          "pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 px-4",
          isGroupDetailPage ? "hidden xl:block" : "hidden md:block",
          shouldShowDock
            ? isGroupDetailPage
              ? "xl:pointer-events-auto"
              : "md:pointer-events-auto"
            : "pointer-events-none",
        ].join(" ")}
        style={{ transformOrigin: "center bottom" }}
      >
        <nav aria-label="PartyMatch Dock 桌機版">
          <Dock className="pointer-events-auto relative flex h-[78px] w-max items-end gap-1.5 rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(247,249,252,0.74))] px-3 py-2.5 shadow-[0_22px_56px_rgba(15,23,42,0.16)] backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-white/70 before:content-[''] lg:gap-2 lg:px-3.5">
            {(mouseX) =>
              dockItems.map((item) => {
                const Icon = item.icon;
                const isActive = isDockItemActive(location.pathname, item.key);

                return (
                  <div key={item.to} className="group relative flex w-[74px] items-end justify-center">
                    <DockIcon
                      mouseX={mouseX}
                      baseSize={46}
                      magnification={74}
                      distance={170}
                      className="relative shrink-0"
                    >
                      <NavLink
                        to={item.to}
                        aria-label={item.label}
                        className={[
                          "relative flex h-full w-full items-center justify-center rounded-[22px] border transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2",
                          getDockSurfaceClasses(isActive),
                        ].join(" ")}
                      >
                        <Icon
                          className={[
                            "shrink-0 stroke-current text-current",
                            "h-6 w-6",
                          ].join(" ")}
                        />
                      </NavLink>
                    </DockIcon>

                    <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full bg-black/88 px-2 py-1 text-[11px] font-medium tracking-[0.01em] text-white opacity-0 shadow-md transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                      {item.label}
                    </span>
                  </div>
                );
              })
            }
          </Dock>
        </nav>
      </MotionDiv>

      <MotionDiv
        initial={false}
        animate={
          isFooterVisible || isModalOpen || !isDockVisible
            ? { y: 96, opacity: 0, scale: 0.985, filter: "blur(6px)" }
            : { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }
        }
        transition={{
          duration: 0.34,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={[
          "fixed bottom-4 left-1/2 z-50 w-auto -translate-x-1/2 px-4",
          isGroupDetailPage ? "hidden" : "md:hidden",
          isFooterVisible || isModalOpen || !isDockVisible ? "pointer-events-none" : "pointer-events-auto",
        ].join(" ")}
        style={{ transformOrigin: "center bottom" }}
      >
        <nav
          className="relative mx-auto rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(247,249,252,0.78))] px-2.5 py-2 shadow-[0_22px_56px_rgba(15,23,42,0.16)] backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-4 before:top-0 before:h-px before:bg-white/70 before:content-['']"
          aria-label="PartyMatch Dock 手機版"
        >
          <ul className="flex items-center gap-1.5">
            {dockItems.map((item) => {
              const Icon = item.icon;
              const isActive = isDockItemActive(location.pathname, item.key);

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    aria-label={item.label}
                    className={[
                      "flex items-center justify-center rounded-[22px] p-1 transition-transform duration-200 ease-out active:scale-95",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "relative flex items-center justify-center rounded-[20px] border transition-all duration-200 ease-out",
                        "h-11 w-11",
                        getDockSurfaceClasses(isActive),
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5 stroke-current" />
                    </span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </MotionDiv>
    </>
  );
}
