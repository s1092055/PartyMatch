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
  const isHomePage = location.pathname === "/";
  const isCreateGroupFlowPage = location.pathname.startsWith("/create-group/new");
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
    <div className="min-h-dvh overflow-x-hidden bg-white text-black">
      <div ref={topAnchorRef} aria-hidden="true" className="h-0 w-0" />
      {!isCreateGroupFlowPage ? <Navbar /> : null}

      <main
        className={
          isCreateGroupFlowPage
            ? "min-h-dvh"
            : isHomePage
              ? "pb-12 md:pb-16"
              : "pb-24 md:pb-28"
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={`${location.pathname}${location.search}`}>
            {outlet ?? <Outlet />}
          </PageTransition>
        </AnimatePresence>
      </main>

      {!isCreateGroupFlowPage ? <Footer /> : null}
      {!isCreateGroupFlowPage ? <DockNav /> : null}
    </div>
  );
}
