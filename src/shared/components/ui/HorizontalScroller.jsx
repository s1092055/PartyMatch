import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function HorizontalScroller({
  children,
  className = "",
  contentClassName = "",
  controlsClassName = "",
  scrollAmountRatio = 0.85,
  controlsVisibility = "always",
}) {
  const scrollerRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function updateScrollState() {
    const node = scrollerRef.current;
    if (!node) return;
    const maxScrollLeft = node.scrollWidth - node.clientWidth;
    setHasOverflow(maxScrollLeft > 2);
    setCanScrollLeft(node.scrollLeft > 2);
    setCanScrollRight(node.scrollLeft < maxScrollLeft - 2);
  }

  function scrollByDir(direction) {
    const node = scrollerRef.current;
    if (!node) return;
    const amount = Math.round(node.clientWidth * scrollAmountRatio);
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [children, scrollAmountRatio]);

  const showControls =
    controlsVisibility === "always"
      ? true
      : controlsVisibility === "overflow"
        ? hasOverflow
        : false;

  return (
    <div
      className={joinClasses(
        "flex items-center",
        showControls ? "gap-3" : "",
        className,
      )}
    >
      {showControls ? (
        <div className={joinClasses("flex items-center gap-2", controlsClassName)}>
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            disabled={!canScrollLeft}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="向左捲動"
          >
            <ChevronLeftIcon className="h-5 w-5 text-black/70" />
          </button>
        </div>
      ) : null}

      <div
        ref={scrollerRef}
        onScroll={updateScrollState}
        className={joinClasses(
          "min-w-0 max-w-full flex-1 overflow-x-auto scrollbar-none scroll-smooth",
          contentClassName,
        )}
      >
        {children}
      </div>

      {showControls ? (
        <div className={joinClasses("flex items-center gap-2", controlsClassName)}>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            disabled={!canScrollRight}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="向右捲動"
          >
            <ChevronRightIcon className="h-5 w-5 text-black/70" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
