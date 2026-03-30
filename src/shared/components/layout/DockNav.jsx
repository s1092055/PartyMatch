import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import {
  HomeIcon,
  MagnifyingGlassIcon,
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
    icon: MagnifyingGlassIcon,
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

const DOCK_TOP_THRESHOLD = 24;
const DOCK_SCROLL_IGNORE_DELTA = 4;
const DOCK_HIDE_THRESHOLD = 28;
const DOCK_SHOW_THRESHOLD = 10;

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
  const lastScrollYRef = useRef(0);
  const scrollDirectionRef = useRef("idle");
  const directionStartYRef = useRef(0);
  const dockVisibleRef = useRef(true);

  const getDockSurfaceClasses = (isActive) =>
    [
      isActive
        ? "border-[#2563eb]/20 bg-[#2563eb] text-white shadow-[0_12px_24px_rgba(37,99,235,0.28)]"
        : "border-black/5 bg-white/70 text-black/65 hover:bg-white hover:text-black",
    ].join(" ");

  useEffect(() => {
    dockVisibleRef.current = isDockVisible;
  }, [isDockVisible]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentScrollY = window.scrollY;
    lastScrollYRef.current = currentScrollY;
    directionStartYRef.current = currentScrollY;
    scrollDirectionRef.current = "idle";
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

      if (currentScrollY <= DOCK_TOP_THRESHOLD) {
        if (!dockVisibleRef.current) {
          dockVisibleRef.current = true;
          setIsDockVisible(true);
        }
        lastScrollYRef.current = currentScrollY;
        directionStartYRef.current = currentScrollY;
        scrollDirectionRef.current = "idle";
        return;
      }

      if (Math.abs(delta) < DOCK_SCROLL_IGNORE_DELTA) {
        lastScrollYRef.current = currentScrollY;
        return;
      }

      if (delta > 0) {
        if (scrollDirectionRef.current !== "down") {
          scrollDirectionRef.current = "down";
          directionStartYRef.current = currentScrollY;
        }

        const movedDown = currentScrollY - directionStartYRef.current;
        if (dockVisibleRef.current && movedDown >= DOCK_HIDE_THRESHOLD) {
          dockVisibleRef.current = false;
          setIsDockVisible(false);
        }
      } else {
        if (scrollDirectionRef.current !== "up") {
          scrollDirectionRef.current = "up";
          directionStartYRef.current = currentScrollY;
        }

        const movedUp = directionStartYRef.current - currentScrollY;
        if (!dockVisibleRef.current && movedUp >= DOCK_SHOW_THRESHOLD) {
          dockVisibleRef.current = true;
          setIsDockVisible(true);
        }
      }

      lastScrollYRef.current = currentScrollY;
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
          isDockVisible
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
          isDockVisible
            ? isGroupDetailPage
              ? "xl:pointer-events-auto"
              : "md:pointer-events-auto"
            : "pointer-events-none",
        ].join(" ")}
        style={{ transformOrigin: "center bottom" }}
      >
        <nav aria-label="PartyMatch Dock 桌機版">
          <Dock className="pointer-events-auto flex h-[82px] w-max items-end gap-2 rounded-[28px] border border-black/10 bg-white/82 px-3 py-3 shadow-[0_22px_52px_rgba(15,23,42,0.18)] backdrop-blur-md lg:gap-2.5 lg:px-3.5">
            {(mouseX) =>
              dockItems.map((item) => {
                const Icon = item.icon;
                const isActive = isDockItemActive(location.pathname, item.key);

                return (
                  <div key={item.to} className="group relative flex w-[82px] items-end justify-center">
                    <DockIcon
                      mouseX={mouseX}
                      baseSize={48}
                      magnification={82}
                      distance={178}
                      className="relative shrink-0"
                    >
                      <NavLink
                        to={item.to}
                        aria-label={item.label}
                        className={[
                          "relative flex h-full w-full items-center justify-center rounded-full border transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/40 focus-visible:ring-offset-2",
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

                    <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full bg-black/88 px-2 py-1 text-[11px] font-medium tracking-[0.01em] text-white opacity-0 shadow-md transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
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
          isDockVisible
            ? { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }
            : { y: 96, opacity: 0, scale: 0.985, filter: "blur(6px)" }
        }
        transition={{
          duration: 0.34,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={[
          "fixed bottom-0 left-0 z-50 w-full border-t border-black/10 bg-white/88 backdrop-blur-xl",
          isGroupDetailPage ? "hidden" : "md:hidden",
          isDockVisible ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        style={{ transformOrigin: "center bottom" }}
      >
        <nav className="mx-auto h-[74px] max-w-5xl px-3" aria-label="PartyMatch Dock 手機版">
          <ul className="grid h-full grid-cols-4 gap-1">
            {dockItems.map((item) => {
              const Icon = item.icon;
              const isActive = isDockItemActive(location.pathname, item.key);

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    aria-label={item.label}
                    className={[
                      "flex h-full items-center justify-center rounded-2xl px-1 transition-colors duration-200 ease-out",
                      isActive ? "text-[#2563eb]" : "text-black/60",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "relative flex items-center justify-center rounded-full border transition-colors duration-200 ease-out",
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
