import { AnimatePresence } from "framer-motion";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Outlet, useLocation, useOutlet } from "react-router-dom";
import { PageTransition } from "../ui/PageTransition.jsx";
import { DockNav } from "./DockNav.jsx";
import { Footer } from "./Footer.jsx";
import { Navbar } from "./Navbar.jsx";

export function AppLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  const isCreateGroupFlowPage = location.pathname.startsWith("/create-group");
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";
  const isStandalonePage = isCreateGroupFlowPage || isAuthPage;
  const topAnchorRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    return undefined;
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return undefined;

    const resetScroll = () => {
      topAnchorRef.current?.scrollIntoView({ block: "start", inline: "nearest" });
      window.scrollTo(0, 0);
      document.scrollingElement?.scrollTo?.(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();

    let rafId = 0;
    let nestedFrameId = 0;
    rafId = window.requestAnimationFrame(() => {
      resetScroll();
      nestedFrameId = window.requestAnimationFrame(() => {
        resetScroll();
      });
    });

    const timeoutId = window.setTimeout(resetScroll, 240);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.cancelAnimationFrame(nestedFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [location.key]);

  return (
    <div className="flex min-h-dvh flex-col [overflow-x:clip] bg-white text-black">
      <div ref={topAnchorRef} aria-hidden="true" className="h-0 w-0" />
      {!isStandalonePage ? <Navbar /> : null}

      <main
        className={
          isStandalonePage
            ? "min-h-dvh"
            : "flex-1 min-h-[calc(100dvh-4rem)]"
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={`${location.pathname}${location.search}`}>
            {outlet ?? <Outlet />}
          </PageTransition>
        </AnimatePresence>
      </main>

      {!isStandalonePage ? <Footer /> : null}
      {!isStandalonePage ? <DockNav /> : null}
    </div>
  );
}
